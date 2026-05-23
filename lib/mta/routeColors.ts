/**
 * Official NYCT subway route colors and bullet shapes.
 * https://new.mta.info/agency/new-york-city-transit/subway-bus-customer-self-service
 *
 * Returns `{ bg, fg, shape }` for a given route. `shape` is "circle" for all
 * local/express service except the 42 St Shuttle (S), which uses a circle too;
 * we keep diamonds for express variants (6X/7X) which appear in GTFS-RT.
 */
export type BulletShape = "circle" | "diamond";

export interface RouteStyle {
  bg: string;
  fg: string;
  shape: BulletShape;
  label: string;
}

const RED = "#EE352E";
const GREEN = "#00933C";
const PURPLE = "#B933AD";
const BLUE = "#2850AD";
const ORANGE = "#FF6319";
const YELLOW = "#FCCC0A";
const LIGHT_GREEN = "#6CBE45";
const BROWN = "#996633";
const GRAY = "#A7A9AC";
const DARK_GRAY = "#808183";
const SIR_BLUE = "#2B5DA7";

const WHITE = "#FFFFFF";
const BLACK = "#000000";

const TABLE: Record<string, RouteStyle> = {
  "1": { bg: RED, fg: WHITE, shape: "circle", label: "1" },
  "2": { bg: RED, fg: WHITE, shape: "circle", label: "2" },
  "3": { bg: RED, fg: WHITE, shape: "circle", label: "3" },

  "4": { bg: GREEN, fg: WHITE, shape: "circle", label: "4" },
  "5": { bg: GREEN, fg: WHITE, shape: "circle", label: "5" },
  "6": { bg: GREEN, fg: WHITE, shape: "circle", label: "6" },
  "6X": { bg: GREEN, fg: WHITE, shape: "diamond", label: "6" },

  "7": { bg: PURPLE, fg: WHITE, shape: "circle", label: "7" },
  "7X": { bg: PURPLE, fg: WHITE, shape: "diamond", label: "7" },

  A: { bg: BLUE, fg: WHITE, shape: "circle", label: "A" },
  C: { bg: BLUE, fg: WHITE, shape: "circle", label: "C" },
  E: { bg: BLUE, fg: WHITE, shape: "circle", label: "E" },

  B: { bg: ORANGE, fg: WHITE, shape: "circle", label: "B" },
  D: { bg: ORANGE, fg: WHITE, shape: "circle", label: "D" },
  F: { bg: ORANGE, fg: WHITE, shape: "circle", label: "F" },
  FX: { bg: ORANGE, fg: WHITE, shape: "diamond", label: "F" },
  M: { bg: ORANGE, fg: WHITE, shape: "circle", label: "M" },

  N: { bg: YELLOW, fg: BLACK, shape: "circle", label: "N" },
  Q: { bg: YELLOW, fg: BLACK, shape: "circle", label: "Q" },
  R: { bg: YELLOW, fg: BLACK, shape: "circle", label: "R" },
  W: { bg: YELLOW, fg: BLACK, shape: "circle", label: "W" },

  G: { bg: LIGHT_GREEN, fg: WHITE, shape: "circle", label: "G" },

  J: { bg: BROWN, fg: WHITE, shape: "circle", label: "J" },
  Z: { bg: BROWN, fg: WHITE, shape: "circle", label: "Z" },

  L: { bg: GRAY, fg: WHITE, shape: "circle", label: "L" },

  S: { bg: DARK_GRAY, fg: WHITE, shape: "circle", label: "S" },
  GS: { bg: DARK_GRAY, fg: WHITE, shape: "circle", label: "S" },
  H: { bg: DARK_GRAY, fg: WHITE, shape: "circle", label: "S" }, // Rockaway Park Shuttle
  FS: { bg: DARK_GRAY, fg: WHITE, shape: "circle", label: "S" }, // Franklin Av Shuttle
  SS: { bg: DARK_GRAY, fg: WHITE, shape: "circle", label: "S" },

  SI: { bg: SIR_BLUE, fg: WHITE, shape: "circle", label: "SIR" },
  SIR: { bg: SIR_BLUE, fg: WHITE, shape: "circle", label: "SIR" },
};

const UNKNOWN: RouteStyle = {
  bg: "#3a3a3a",
  fg: WHITE,
  shape: "circle",
  label: "?",
};

export function routeStyle(routeId: string): RouteStyle {
  if (!routeId) return UNKNOWN;
  return TABLE[routeId.toUpperCase()] ?? { ...UNKNOWN, label: routeId };
}
