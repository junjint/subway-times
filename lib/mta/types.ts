/**
 * Shared types for the Subway Screen data layer.
 *
 * The shapes here are intentionally provider-agnostic so the realtime data
 * source can be swapped (e.g. direct GTFS-RT, MTA Realtime JSON API, a
 * third-party service) without touching the UI.
 */

export type SubwayRoute =
  | "1" | "2" | "3" | "4" | "5" | "6" | "6X" | "7" | "7X"
  | "A" | "B" | "C" | "D" | "E" | "F" | "FX" | "G"
  | "H" | "J" | "L" | "M" | "N" | "Q" | "R" | "W" | "Z"
  | "S" | "SI" | "SIR";

export type StationDirection = "N" | "S";

/**
 * Direction labels are station-specific (e.g. "Manhattan" / "Outbound" at
 * Grand Av-Newtown). Real direction (N/S) maps to either label depending on
 * the station's geometry.
 */
export interface DirectionLabels {
  N: string;
  S: string;
}

export interface Station {
  /** Parent GTFS stop id, e.g. "G12" for Grand Av-Newtown. */
  gtfsStopId: string;
  /** MTA station id (open-data primary key, not always equal to GTFS id). */
  stationId: string;
  /** Complex id (multiple stations can share a complex, e.g. Times Sq). */
  complexId: string;
  /** Human-readable stop name. */
  name: string;
  /** Borough name spelled out. */
  borough: string;
  /** GTFS subway division (IRT / IND / BMT / SIR). */
  division: string;
  /** Trunk line name, e.g. "Queens Blvd". */
  line: string;
  /** Routes that serve this station during normal weekday daytime service. */
  routes: string[];
  /** Above-ground, subway, elevated, etc. */
  structure: string;
  /** Latitude (WGS-84). */
  lat: number;
  /** Longitude (WGS-84). */
  lng: number;
  /** Direction labels as posted on the platform signage. */
  directionLabels: DirectionLabels;
  /** ADA accessibility code from MTA open data (0/1/2). */
  ada: number;
  /** Direction-specific GTFS stop ids that appear in realtime feeds. */
  stopIds: {
    N: string;
    S: string;
  };
}

export interface NormalizedArrival {
  /** GTFS route id, e.g. "M" or "6". */
  routeId: string;
  /** Direction the train is going (N or S, derived from GTFS stop id suffix). */
  direction: StationDirection;
  /** Human-readable direction label posted on the platform. */
  directionLabel: string;
  /** Last stop (terminus) of the trip. */
  destination: string;
  /** Unix seconds (UTC) when the train is scheduled to arrive. */
  arrivalTime: number;
  /** Minutes until arrival, computed at fetch time. Negative => departing. */
  minutesAway: number;
  /** Direction-specific stop id matched (e.g. "G12N"). */
  stopId: string;
  /** GTFS trip id, useful for debugging / dedup. */
  tripId: string;
  /** True if minutesAway is 0 and the screen should say "Arriving". */
  isArriving: boolean;
}

export interface ArrivalsResponse {
  station: Station;
  arrivals: NormalizedArrival[];
  /** ISO-8601 timestamp of when this snapshot was produced. */
  updatedAt: string;
  /** Which provider produced the data (so the UI can warn on fallback). */
  source: "gtfs-rt" | "fallback";
  /** Optional warning, used when falling back to demo data. */
  warning?: string;
}
