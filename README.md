# Subway Screen

A Next.js web app that displays live NYC subway arrivals in the style of an
MTA platform countdown board. Built from official MTA data:

- **Stations**: [MTA Subway Stations open dataset](https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f)
  (bundled at build time into `lib/mta/data/stations.json`)
- **Arrivals**: [MTA GTFS-Realtime feeds](https://api.mta.info/) — direct
  protobuf parsing via [`gtfs-realtime-bindings`](https://www.npmjs.com/package/gtfs-realtime-bindings).
  No API key required. The MTA endpoints send `Access-Control-Allow-Origin: *`
  so the feeds can be fetched directly from the browser.

Default station: **Grand Av-Newtown (M, R)** in Queens.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS
- **Fully static** — exported with `next build` (`output: "export"`) and
  deployed to GitHub Pages. All MTA fetching and parsing runs in the browser.
- A swappable [provider abstraction](./lib/mta/provider.ts) so the realtime
  data source can be replaced without touching the UI.

## Deploying to GitHub Pages

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds
the static export on every push to `main` and deploys it to GitHub Pages.

One-time setup after pushing the repo:

1. Repo → Settings → Pages → **Source: GitHub Actions**.
2. Push to `main`. The workflow does the rest.

The site will be live at `https://<your-user>.github.io/<repo>/`.

The workflow auto-sets `NEXT_PUBLIC_BASE_PATH=/<repo>` so assets resolve
correctly under the GitHub Pages subpath.

## Getting started

```bash
npm install

# Refresh the bundled stations.json from MTA open data (already committed)
npm run build-stations

npm run dev   # http://localhost:3000
```

## How it works

1. **Stations** are bundled at build time. Each row carries the parent GTFS
   stop ID plus the direction-specific `${id}N` / `${id}S` IDs that appear
   in the real-time feeds.
2. **Arrivals**: when the user picks a station, the browser looks up which
   route group(s) serve the station (`feeds.ts`), fetches every matching
   GTFS-RT protobuf in parallel directly from `api-endpoint.mta.info`,
   decodes each `FeedMessage`, and walks every `trip_update.stop_time_update`
   looking for the station's stop IDs.
3. **Matching**: a stop_time_update with `stop_id = "G12N"` is the next
   Forest Hills-bound M/R train at Grand Av-Newtown.
4. **UI**: arrivals are sorted by ETA, "Arriving" is shown for trains < 30 s
   away, and the board auto-refreshes every 30 s. Refresh is also triggered
   when the tab becomes visible again.

## Fallback / demo mode

If every realtime feed fails (network outage, MTA downtime), `provider.ts`
falls back to synthetic data and the UI surfaces a **"Demo data"** badge in
the status bar plus a red banner above the board so the times are never
misrepresented as live.

## Client API

The browser-side data layer (`lib/mta/client.ts`) exposes two functions:

```ts
listStationsClient(): Station[]
getArrivalsClient(stationId: string): Promise<ArrivalsResponse>
```

`ArrivalsResponse` shape:

```jsonc
{
  "station": { /* Station */ },
  "arrivals": [
    {
      "routeId": "M",
      "direction": "S",
      "directionLabel": "Manhattan",
      "destination": "Forest Hills-71 Av",
      "arrivalTime": 1716468123,
      "minutesAway": 5,
      "stopId": "G12S",
      "tripId": "…",
      "isArriving": false
    }
  ],
  "updatedAt": "2026-05-23T14:42:03.123Z",
  "source": "gtfs-rt"
}
```

## Project layout

```
app/
  layout.tsx             root layout (dark theme)
  page.tsx               main board (search + arrivals)
components/
  ArrivalBoard.tsx       direction filter + list of rows
  ArrivalRow.tsx         single row [bullet] destination  N min
  ErrorState.tsx
  LastUpdated.tsx        relative timestamp + refresh button
  LoadingState.tsx       skeleton matching the board layout
  StationHeader.tsx      station name + route bullets
  StationSearch.tsx      debounced autocomplete with keyboard support
  SubwayBullet.tsx       colored route bullet (circle / diamond)
lib/
  mta/
    data/stations.json   generated from MTA open data
    client.ts            browser-side facade for the provider
    feeds.ts             route → realtime feed URL map
    fallback.ts          synthetic demo data
    provider.ts          ArrivalsProvider abstraction (swappable)
    realtime.ts          GTFS-RT fetcher + decoder
    routeColors.ts       official NYCT bullet colors
    stations.ts          station catalog + lookup helpers
    types.ts             shared types
  util/clsx.ts           tiny classnames helper
scripts/
  build-stations.ts      fetches MTA open data into stations.json
.github/workflows/
  deploy.yml             builds + deploys to GitHub Pages on push to main
```

## License / data notice

This project ships data sourced from the MTA's public open-data feeds. It is
not affiliated with or endorsed by the Metropolitan Transportation Authority.
Posted arrival times can differ from real conditions.
