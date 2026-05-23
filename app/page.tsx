"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorState } from "@/components/ErrorState";
import { LastUpdated } from "@/components/LastUpdated";
import { LedDisplay } from "@/components/LedDisplay";
import { StationSearch } from "@/components/StationSearch";
import { SubwayBullet } from "@/components/SubwayBullet";
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
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-3xl mx-auto flex flex-col gap-8 sm:gap-10">
      {/* Top strip: credit (left) + station info (right) */}
      <header className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-black/10">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: "#14271b",
              boxShadow: "0 0 4px rgba(20,39,27,0.4)",
            }}
          />
          <p className="text-neutral-600 text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium">
            Made by Junjin Tan
          </p>
        </div>

        {stationForDisplay ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-end leading-none">
              <span className="text-neutral-900 font-bold uppercase text-sm sm:text-base tracking-tight">
                {stationForDisplay.name}
              </span>
              <span className="text-neutral-500 text-[10px] sm:text-xs tracking-widest uppercase mt-1">
                {stationForDisplay.borough}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {stationForDisplay.routes.map((r) => (
                <SubwayBullet key={r} route={r} size="sm" />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-7 w-44 bg-black/5 rounded animate-pulse" />
        )}
      </header>

      {/* Station picker (above the sign so it's the first thing users find) */}
      <section className="flex flex-col gap-3">
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
      </section>

      {/* Hero LED sign */}
      <section className="px-1 sm:px-4 pt-2 pb-10">
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
        <div className="bg-red-50 border border-red-300 rounded px-4 py-3 text-red-700 text-sm text-center">
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
        <p className="text-red-700 text-xs text-center">
          Last refresh failed: {arrivalsError}. Showing previous data.
        </p>
      )}

      {/* Status bar: live indicator + refresh */}
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <LastUpdated
          updatedAt={arrivals?.updatedAt ?? null}
          isRefreshing={isRefreshing}
          onRefresh={handleManualRefresh}
          source={arrivals?.source}
        />
        <p className="text-neutral-500 text-[11px] uppercase tracking-widest">
          Auto-refresh · {POLL_INTERVAL_MS / 1000}s
        </p>
      </section>

      {/* Footer attribution */}
      <footer className="mt-auto pt-8 text-center">
        <p className="text-neutral-500 text-[10px] leading-relaxed max-w-md mx-auto">
          Live data:{" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-900"
          >
            MTA GTFS-Realtime
          </a>{" "}
          ·{" "}
          <a
            href="https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-900"
          >
            MTA Subway Stations
          </a>
          . Not affiliated with the MTA.
        </p>
      </footer>
    </main>
  );
}
