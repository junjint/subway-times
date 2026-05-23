/**
 * MTA GTFS-Realtime feed catalog.
 *
 * Since November 2023 the MTA dropped the API-key requirement: feeds are now
 * served as anonymous HTTP from api-endpoint.mta.info. Each feed bundles a
 * group of routes (the original divisions). The mapping below is the
 * authoritative list from the MTA developer portal.
 *
 * Reference:
 * https://api.mta.info/#/subwayRealTimeFeeds
 */

export type FeedKey =
  | "ace"
  | "bdfm"
  | "g"
  | "jz"
  | "nqrw"
  | "l"
  | "numbered" // 1-7 + S (42 St Shuttle)
  | "si";

interface FeedDef {
  url: string;
  routes: string[];
}

const FEEDS: Record<FeedKey, FeedDef> = {
  ace: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
    routes: ["A", "C", "E", "H", "FS"], // H = Rockaway Park Shuttle, FS = Franklin Shuttle is on bdfm actually
  },
  bdfm: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
    routes: ["B", "D", "F", "FX", "M", "FS"], // FS = Franklin Av Shuttle
  },
  g: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
    routes: ["G"],
  },
  jz: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
    routes: ["J", "Z"],
  },
  nqrw: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
    routes: ["N", "Q", "R", "W"],
  },
  l: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
    routes: ["L"],
  },
  numbered: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
    routes: ["1", "2", "3", "4", "5", "6", "6X", "7", "7X", "S", "SS", "GS"],
  },
  si: {
    url: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si",
    routes: ["SI", "SIR"],
  },
};

/**
 * Returns the set of feed URLs that may contain arrival info for the given
 * set of routes. Always returns a deduplicated list.
 */
export function feedUrlsForRoutes(routes: Iterable<string>): string[] {
  const wanted = new Set<string>();
  const upperRoutes = new Set(Array.from(routes).map((r) => r.toUpperCase()));
  for (const key of Object.keys(FEEDS) as FeedKey[]) {
    const def = FEEDS[key];
    for (const r of def.routes) {
      if (upperRoutes.has(r)) {
        wanted.add(def.url);
        break;
      }
    }
  }
  return Array.from(wanted);
}

export function allFeedUrls(): string[] {
  return Object.values(FEEDS).map((f) => f.url);
}

/** For the rare case (e.g. shuttle service) where we want to scan everything. */
export const FEED_DEFS = FEEDS;
