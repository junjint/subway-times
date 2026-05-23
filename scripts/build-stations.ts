/**
 * Build a normalized station list JSON from the official MTA Subway Stations
 * dataset (https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f).
 *
 * Run with:  npm run build-stations
 *
 * Output:    lib/mta/data/stations.json
 *
 * The MTA dataset is a station-level (not stop-level) list. Each row has a
 * "GTFS Stop ID" which is the parent stop. The corresponding direction-
 * specific stop IDs are `${parent}N` and `${parent}S` in the GTFS-Realtime
 * stop_time_update messages. This is the convention NYCT uses across all
 * subway divisions (IRT, IND, BMT, SIR).
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MTA_STATIONS_CSV =
  "https://data.ny.gov/api/views/39hk-dx4f/rows.csv?accessType=DOWNLOAD";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = join(__dirname, "..", "lib", "mta", "data", "stations.json");

interface RawStation {
  gtfsStopId: string;
  stationId: string;
  complexId: string;
  division: string;
  line: string;
  name: string;
  borough: string;
  cbd: boolean;
  routes: string[];
  structure: string;
  lat: number;
  lng: number;
  northLabel: string;
  southLabel: string;
  ada: number;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

const BOROUGH_NAMES: Record<string, string> = {
  M: "Manhattan",
  Bk: "Brooklyn",
  Bx: "Bronx",
  Q: "Queens",
  SI: "Staten Island",
};

async function main() {
  console.log(`Fetching ${MTA_STATIONS_CSV} ...`);
  const res = await fetch(MTA_STATIONS_CSV);
  if (!res.ok) {
    throw new Error(`Failed to fetch stations CSV: HTTP ${res.status}`);
  }
  const csv = await res.text();
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines.shift() as string);

  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Missing column: ${name}`);
    return i;
  };

  const cGtfs = idx("GTFS Stop ID");
  const cStationId = idx("Station ID");
  const cComplex = idx("Complex ID");
  const cDivision = idx("Division");
  const cLine = idx("Line");
  const cName = idx("Stop Name");
  const cBorough = idx("Borough");
  const cCbd = idx("CBD");
  const cRoutes = idx("Daytime Routes");
  const cStructure = idx("Structure");
  const cLat = idx("GTFS Latitude");
  const cLng = idx("GTFS Longitude");
  const cNorth = idx("North Direction Label");
  const cSouth = idx("South Direction Label");
  const cAda = idx("ADA");

  const stations: RawStation[] = [];
  for (const line of lines) {
    const row = parseCsvLine(line);
    if (row.length < header.length) continue;
    const routes = row[cRoutes]
      .split(/\s+/)
      .map((r) => r.trim())
      .filter(Boolean);
    stations.push({
      gtfsStopId: row[cGtfs].trim(),
      stationId: row[cStationId].trim(),
      complexId: row[cComplex].trim(),
      division: row[cDivision].trim(),
      line: row[cLine].trim(),
      name: row[cName].trim(),
      borough: BOROUGH_NAMES[row[cBorough].trim()] ?? row[cBorough].trim(),
      cbd: row[cCbd].trim().toLowerCase() === "true",
      routes,
      structure: row[cStructure].trim(),
      lat: parseFloat(row[cLat]),
      lng: parseFloat(row[cLng]),
      northLabel: row[cNorth].trim(),
      southLabel: row[cSouth].trim(),
      ada: parseInt(row[cAda] || "0", 10) || 0,
    });
  }

  console.log(`Parsed ${stations.length} stations`);

  const dir = dirname(OUT_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(stations, null, 2));
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
