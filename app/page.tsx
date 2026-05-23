"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorState } from "@/components/ErrorState";
import { LastUpdated } from "@/components/LastUpdated";
import { LedDisplay } from "@/components/LedDisplay";
import { StationSearch } from "@/components/StationSearch";
import { getArrivalsClient, listStationsClient } from "@/lib/mta/client";
import type { ArrivalsResponse, Station } from "@/lib/mta/types";

const DEFAULT_STATION_ID = "G12"; // Grand Av-Newtown (M, R)
const POLL_INTERVAL_MS = 30_000;
const STORAGE_KEY = "subway-screen:selected-station";

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [stationsError, setStationsError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [arrivals, setArrivals] = useState<ArrivalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [arrivalsError, setArrivalsError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    try {
      setStations(listStationsClient());
    } catch (err) {
      setStationsError(
        err instanceof Error ? err.message : "Failed to load station list",
      );
    }
  }, []);

  useEffect(() => {
    if (stations.length === 0) return;
    let initial = DEFAULT_STATION_ID;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stations.some((s) => s.gtfsStopId === stored)) initial = stored;
    } catch {
      /* ignore */
    }
    setSelectedId(initial);
  }, [stations]);

  const fetchArrivals = useCallback(
    async (stationId: string, opts: { silent?: boolean } = {}) => {
      const seq = ++fetchSeqRef.current;
      if (opts.silent) setIsRefreshing(true);
      else setIsLoading(true);
      setArrivalsError(null);
      try {
        const data = await getArrivalsClient(stationId);
        if (seq !== fetchSeqRef.current) return;
        setArrivals(data);
      } catch (err) {
        if (seq !== fetchSeqRef.current) return;
        setArrivalsError(err instanceof Error ? err.message : "Failed to load arrivals");
      } finally {
        if (seq === fetchSeqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedId) return;
    setArrivals(null);
    fetchArrivals(selectedId);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchArrivals(selectedId, { silent: true });
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedId, fetchArrivals]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible" && selectedId) {
        fetchArrivals(selectedId, { silent: true });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [selectedId, fetchArrivals]);

  const handleSelect = useCallback((s: Station) => {
    setSelectedId(s.gtfsStopId);
    try {
      window.localStorage.setItem(STORAGE_KEY, s.gtfsStopId);
    } catch {
      /* ignore */
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    if (selectedId) fetchArrivals(selectedId, { silent: true });
  }, [selectedId, fetchArrivals]);

  // Build a stable Station to render while loading or when arrivals null
  const fallbackStation = useMemo(
    () => stations.find((s) => s.gtfsStopId === selectedId) ?? null,
    [stations, selectedId],
  );

  const stationForDisplay = arrivals?.station ?? fallbackStation;

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-10 sm:py-16 max-w-3xl mx-auto flex flex-col gap-10 sm:gap-12">
      {/* Branding strip */}
      <header className="flex items-center justify-center gap-3">
        <span
          aria-hidden
          className="h-2 w-2 rounded-full bg-mta-amber amber-glow"
        />
        <h1 className="text-mta-amber uppercase tracking-[0.4em] text-xs sm:text-sm font-bold">
          Subway Times
        </h1>
        <span
          aria-hidden
          className="h-2 w-2 rounded-full bg-mta-amber amber-glow"
        />
      </header>

      {/* Hero LED sign */}
      <section className="px-2 sm:px-6 pt-2 pb-12">
        {stationForDisplay ? (
          <LedDisplay
            station={stationForDisplay}
            arrivals={arrivals?.arrivals ?? []}
            loading={isLoading || !arrivals}
          />
        ) : (
          <div className="h-48 wood-frame">
            <div className="led-board h-full" />
          </div>
        )}
      </section>

      {/* Optional fallback / error warnings */}
      {arrivals?.warning && (
        <div className="bg-mta-red/15 border border-mta-red/50 rounded px-4 py-3 text-mta-red text-sm text-center">
          <strong className="uppercase tracking-wider mr-2">Notice:</strong>
          {arrivals.warning}
        </div>
      )}
      {arrivalsError && !arrivals && (
        <ErrorState
          message={arrivalsError}
          onRetry={() => selectedId && fetchArrivals(selectedId)}
        />
      )}
      {arrivalsError && arrivals && (
        <p className="text-mta-red text-xs text-center">
          Last refresh failed: {arrivalsError}. Showing previous data.
        </p>
      )}

      {/* Controls: station search + refresh status */}
      <section className="flex flex-col gap-4">
        {stationsError ? (
          <p className="text-mta-red text-sm text-center">
            Couldn’t load station list: {stationsError}
          </p>
        ) : (
          <StationSearch
            stations={stations}
            selectedStationId={selectedId}
            onSelect={handleSelect}
          />
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <LastUpdated
            updatedAt={arrivals?.updatedAt ?? null}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
            source={arrivals?.source}
          />
          <p className="text-mta-gray text-[11px] uppercase tracking-widest">
            Auto-refresh · {POLL_INTERVAL_MS / 1000}s
          </p>
        </div>
      </section>

      {/* Footer credits */}
      <footer className="mt-auto pt-10 flex flex-col items-center gap-2 text-center">
        <p className="text-mta-gray text-[10px] sm:text-xs tracking-[0.3em] uppercase">
          made by junjin tan
        </p>
        <p className="text-mta-gray/70 text-[10px] leading-relaxed max-w-md">
          Live data:{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            MTA GTFS-Realtime
          </a>{" "}
          ·{" "}
          <a
            href="https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            MTA Subway Stations
          </a>
          . Not affiliated with the MTA.
        </p>
      </footer>
    </main>
  );
}
