/**
 * GTFS-Realtime parser for MTA NYCT subway feeds.
 *
 * The MTA publishes one binary protobuf feed per route group. We fetch every
 * relevant feed in parallel, parse each FeedMessage with gtfs-realtime-bindings,
 * and extract stop_time_updates that match the requested station's
 * direction-specific GTFS stop ids.
 *
 * Implementation notes:
 *   - We use Node's global fetch and tag every request with a short timeout.
 *   - Feeds are fetched in parallel; one failing feed does not poison the rest.
 *   - We deduplicate arrivals by (tripId, stopId) keeping the latest update.
 *   - Past arrivals (> 60s old) are dropped; "Arriving" is anything < 30s away.
 */
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import {
  getStationByStopId,
  resolveDirectionalStopId,
} from "./stations";
import { feedUrlsForRoutes } from "./feeds";
import type {
  NormalizedArrival,
  Station,
  StationDirection,
} from "./types";

const FEED_TIMEOUT_MS = 8_000;
const ARRIVING_THRESHOLD_SECONDS = 30;
const STALE_SECONDS = 60;

const { transit_realtime } = GtfsRealtimeBindings;
type ITripUpdate = GtfsRealtimeBindings.transit_realtime.ITripUpdate;

/**
 * GTFS-Realtime stores epoch seconds as protobufjs Long values. We accept any
 * numeric-ish input and normalize to a Number. Returns null when the value is
 * absent or unparseable.
 */
type LongLike = { toNumber?: () => number; low?: number; high?: number; unsigned?: boolean };
function toEpochSeconds(t: unknown): number | null {
  if (t == null) return null;
  if (typeof t === "number") return t;
  if (typeof t === "bigint") return Number(t);
  if (typeof t === "object") {
    const l = t as LongLike;
    if (typeof l.toNumber === "function") return l.toNumber();
    if (typeof l.low === "number" && typeof l.high === "number") {
      return l.high * 2 ** 32 + (l.low >>> 0);
    }
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

async function fetchFeed(url: string): Promise<Uint8Array | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/x-protobuf, */*" },
    });
    if (!res.ok) {
      console.warn(`[mta] feed ${url} -> HTTP ${res.status}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch (err) {
    console.warn(`[mta] feed ${url} fetch failed`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Best-effort destination name from a trip update: the final stop_time_update
 * in the trip. We look it up against our station catalog to get a friendly
 * name; if we can't find it we fall back to the raw stop id.
 */
function destinationFromTrip(tripUpdate: ITripUpdate): string {
  const sts = tripUpdate.stopTimeUpdate;
  if (!sts || sts.length === 0) return "";
  const last = sts[sts.length - 1];
  const stopId = last?.stopId ?? "";
  if (!stopId) return "";
  const parent = stopId.replace(/[NS]$/, "");
  const station = getStationByStopId(parent);
  if (station) return station.name;
  return stopId;
}

function parseFeedForStation(
  buf: Uint8Array,
  station: Station,
  wantedStopIds: Set<string>,
  nowSec: number,
): NormalizedArrival[] {
  const feed = transit_realtime.FeedMessage.decode(buf);
  const out: NormalizedArrival[] = [];

  for (const entity of feed.entity ?? []) {
    const tu = entity.tripUpdate;
    if (!tu) continue;

    const routeId = tu.trip?.routeId ?? "";
    const tripId = tu.trip?.tripId ?? "";
    const destination = destinationFromTrip(tu);

    for (const stu of tu.stopTimeUpdate ?? []) {
      const stopId = stu.stopId ?? "";
      if (!wantedStopIds.has(stopId)) continue;

      const arrTime =
        toEpochSeconds(stu.arrival?.time) ??
        toEpochSeconds(stu.departure?.time);
      if (arrTime == null) continue;

      const deltaSec = arrTime - nowSec;
      if (deltaSec < -STALE_SECONDS) continue;

      const direction: StationDirection = stopId.endsWith("N")
        ? "N"
        : stopId.endsWith("S")
        ? "S"
        : (resolveDirectionalStopId(stopId)?.direction ?? "N");

      const minutesAway = Math.max(0, Math.round(deltaSec / 60));
      out.push({
        routeId,
        direction,
        directionLabel: station.directionLabels[direction] || "",
        destination: destination || stopId,
        arrivalTime: arrTime,
        minutesAway,
        stopId,
        tripId,
        isArriving: deltaSec <= ARRIVING_THRESHOLD_SECONDS,
      });
    }
  }
  return out;
}

/**
 * Public API: get all upcoming arrivals at the given station.
 *
 * @throws if every feed request failed (caller can fall back to demo data).
 */
export async function getArrivalsForStation(
  station: Station,
  opts: { now?: Date } = {},
): Promise<NormalizedArrival[]> {
  const now = opts.now ?? new Date();
  const nowSec = Math.floor(now.getTime() / 1000);

  const wantedStopIds = new Set<string>([station.stopIds.N, station.stopIds.S]);
  const urls = feedUrlsForRoutes(station.routes);
  if (urls.length === 0) return [];

  const results = await Promise.allSettled(urls.map(fetchFeed));
  const buffers: Uint8Array[] = [];
  let succeeded = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      succeeded++;
      buffers.push(r.value);
    }
  }
  if (succeeded === 0) {
    throw new Error("All MTA feeds failed to load");
  }

  const collected: NormalizedArrival[] = [];
  for (const buf of buffers) {
    try {
      collected.push(...parseFeedForStation(buf, station, wantedStopIds, nowSec));
    } catch (err) {
      console.warn("[mta] failed to decode feed", err);
    }
  }

  // Dedup by (tripId + stopId) - keep the latest arrivalTime if the same
  // trip appears in multiple feeds (shouldn't normally happen).
  const seen = new Map<string, NormalizedArrival>();
  for (const a of collected) {
    const key = `${a.tripId}|${a.stopId}`;
    const prev = seen.get(key);
    if (!prev || a.arrivalTime > prev.arrivalTime) seen.set(key, a);
  }
  const deduped = Array.from(seen.values());
  deduped.sort((a, b) => a.arrivalTime - b.arrivalTime);
  return deduped;
}
