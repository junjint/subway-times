/**
 * Browser-side data layer.
 *
 * The app is published as a fully static site (GitHub Pages), so there is no
 * Node API in production. We re-export the station catalog and run the
 * realtime provider directly in the browser — gtfs-realtime-bindings is just
 * protobufjs underneath, which runs anywhere; the MTA feeds send
 * `access-control-allow-origin: *` so cross-origin fetches succeed.
 */
import { getAllStations, getStationByStopId } from "./stations";
import { getArrivals } from "./provider";
import type { ArrivalsResponse, Station } from "./types";

export function listStationsClient(): Station[] {
  return getAllStations();
}

export async function getArrivalsClient(stationId: string): Promise<ArrivalsResponse> {
  const station = getStationByStopId(stationId);
  if (!station) throw new Error(`Unknown stationId: ${stationId}`);
  return getArrivals(station);
}
