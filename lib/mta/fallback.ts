/**
 * Demo / fallback arrival data. Used ONLY when every realtime feed fails.
 * The response is clearly flagged as `source: "fallback"` so the UI can warn
 * the user that the times are not live.
 */
import type { NormalizedArrival, Station } from "./types";

/**
 * Generates a plausible-looking set of arrivals for the given station so the
 * UI never goes completely empty in catastrophic-failure mode (e.g. the MTA
 * feeds are down or the deployment has no network egress).
 */
export function generateFallbackArrivals(
  station: Station,
  now: Date = new Date(),
): NormalizedArrival[] {
  const baseSec = Math.floor(now.getTime() / 1000);
  const routes = station.routes.length > 0 ? station.routes : ["?"];

  const arrivals: NormalizedArrival[] = [];
  let cursorN = 90;
  let cursorS = 60;

  for (let i = 0; i < 8; i++) {
    const route = routes[i % routes.length];
    const goNorth = i % 2 === 0;
    const direction = goNorth ? "N" : "S";
    const offset = goNorth ? cursorN : cursorS;
    if (goNorth) cursorN += 180 + Math.round(Math.random() * 120);
    else cursorS += 180 + Math.round(Math.random() * 120);

    const label =
      (goNorth ? station.directionLabels.N : station.directionLabels.S) ||
      (goNorth ? "Uptown" : "Downtown");

    arrivals.push({
      routeId: route,
      direction,
      directionLabel: label,
      destination: label,
      arrivalTime: baseSec + offset,
      minutesAway: Math.max(0, Math.round(offset / 60)),
      stopId: goNorth ? station.stopIds.N : station.stopIds.S,
      tripId: `fallback-${i}`,
      isArriving: offset <= 30,
    });
  }
  arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime);
  return arrivals;
}
