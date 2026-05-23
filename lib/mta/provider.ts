/**
 * Provider abstraction so the underlying realtime data source can be swapped
 * (e.g. direct GTFS-RT today, a third-party API or scraped JSON tomorrow)
 * without touching the API routes or the UI.
 *
 * Today the only real provider is `GtfsRealtimeProvider`. If it throws (every
 * MTA feed unreachable) we fall back to `FallbackProvider` which returns
 * synthetic data clearly flagged as not live.
 */
import { generateFallbackArrivals } from "./fallback";
import { getArrivalsForStation } from "./realtime";
import type { ArrivalsResponse, Station } from "./types";

export interface ArrivalsProvider {
  name: "gtfs-rt" | "fallback";
  getArrivals(station: Station, now?: Date): Promise<ArrivalsResponse>;
}

export class GtfsRealtimeProvider implements ArrivalsProvider {
  name = "gtfs-rt" as const;
  async getArrivals(station: Station, now: Date = new Date()): Promise<ArrivalsResponse> {
    const arrivals = await getArrivalsForStation(station, { now });
    return {
      station,
      arrivals,
      updatedAt: now.toISOString(),
      source: "gtfs-rt",
    };
  }
}

export class FallbackProvider implements ArrivalsProvider {
  name = "fallback" as const;
  async getArrivals(station: Station, now: Date = new Date()): Promise<ArrivalsResponse> {
    const arrivals = generateFallbackArrivals(station, now);
    return {
      station,
      arrivals,
      updatedAt: now.toISOString(),
      source: "fallback",
      warning:
        "Live MTA feeds are temporarily unavailable. Showing simulated demo data.",
    };
  }
}

let primary: ArrivalsProvider = new GtfsRealtimeProvider();
let fallback: ArrivalsProvider = new FallbackProvider();

export function setPrimaryProvider(p: ArrivalsProvider) {
  primary = p;
}
export function setFallbackProvider(p: ArrivalsProvider) {
  fallback = p;
}

/**
 * High-level API used by the API route. Always resolves; never throws.
 * On primary failure, returns a fallback response with `source: "fallback"`.
 */
export async function getArrivals(
  station: Station,
  opts: { now?: Date; allowFallback?: boolean } = {},
): Promise<ArrivalsResponse> {
  const now = opts.now ?? new Date();
  try {
    return await primary.getArrivals(station, now);
  } catch (err) {
    if (opts.allowFallback === false) throw err;
    console.warn("[mta] primary provider failed; using fallback:", err);
    return await fallback.getArrivals(station, now);
  }
}
