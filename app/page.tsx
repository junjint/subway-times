"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrivalBoard } from "@/components/ArrivalBoard";
import { ErrorState } from "@/components/ErrorState";
import { LastUpdated } from "@/components/LastUpdated";
import { LoadingState } from "@/components/LoadingState";
import { StationHeader } from "@/components/StationHeader";
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

  // --- Load station catalog once on mount ---
  useEffect(() => {
    try {
      setStations(listStationsClient());
    } catch (err) {
      setStationsError(
        err instanceof Error ? err.message : "Failed to load station list",
      );
    }
  }, []);

  // Restore from localStorage (only after stations loaded so we can validate)
  useEffect(() => {
    if (stations.length === 0) return;
    let initial = DEFAULT_STATION_ID;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stations.some((s) => s.gtfsStopId === stored)) {
        initial = stored;
      }
    } catch {
      // localStorage may throw in private mode; ignore
    }
    setSelectedId(initial);
  }, [stations]);

  // --- Fetch arrivals for the selected station ---
  const fetchArrivals = useCallback(
    async (stationId: string, opts: { silent?: boolean } = {}) => {
      const seq = ++fetchSeqRef.current;
      if (opts.silent) setIsRefreshing(true);
      else setIsLoading(true);
      setArrivalsError(null);

      try {
        const data = await getArrivalsClient(stationId);
        // Discard out-of-order responses (user switched stations mid-flight)
        if (seq !== fetchSeqRef.current) return;
        setArrivals(data);
      } catch (err) {
        if (seq !== fetchSeqRef.current) return;
        const msg = err instanceof Error ? err.message : "Failed to load arrivals";
        setArrivalsError(msg);
      } finally {
        if (seq === fetchSeqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  // --- Wire up polling whenever the selected station changes ---
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

  // --- Pause polling when tab is hidden, refresh on resume ---
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

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 sm:py-10 max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Top bar — branding + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="h-3 w-3 rounded-full bg-mta-amber amber-glow"
            />
            <span className="text-mta-amber uppercase tracking-[0.3em] text-xs font-bold">
              Subway Screen
            </span>
          </div>
          <p className="text-mta-gray text-xs sm:text-sm mt-1">
            NYC MTA platform countdown · powered by GTFS-Realtime
          </p>
        </div>
        <div className="w-full sm:max-w-md">
          {stationsError ? (
            <p className="text-mta-red text-sm">
              Couldn’t load station list: {stationsError}
            </p>
          ) : (
            <StationSearch
              stations={stations}
              selectedStationId={selectedId}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      {/* Main board */}
      <div className="flex flex-col gap-4">
        {arrivals ? (
          <>
            <StationHeader station={arrivals.station} />
            {arrivals.warning && (
              <div className="bg-mta-red/15 border border-mta-red/50 rounded px-4 py-3 text-mta-red text-sm">
                <strong className="uppercase tracking-wider mr-2">Notice:</strong>
                {arrivals.warning}
              </div>
            )}
            <ArrivalBoard data={arrivals} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <LastUpdated
                updatedAt={arrivals.updatedAt}
                isRefreshing={isRefreshing}
                onRefresh={handleManualRefresh}
                source={arrivals.source}
              />
              <p className="text-mta-gray text-xs">
                Auto-refreshing every {POLL_INTERVAL_MS / 1000} seconds
              </p>
            </div>
          </>
        ) : isLoading || !selectedId ? (
          <>
            <div className="h-16 bg-white/5 rounded animate-pulse" />
            <LoadingState />
          </>
        ) : arrivalsError ? (
          <ErrorState
            message={arrivalsError}
            onRetry={() => selectedId && fetchArrivals(selectedId)}
          />
        ) : null}

        {arrivalsError && arrivals && (
          <p className="text-mta-red text-xs">
            Last refresh failed: {arrivalsError}. Showing previous data.
          </p>
        )}
      </div>

      <footer className="mt-auto pt-8 text-mta-gray text-[11px] sm:text-xs leading-relaxed">
        <p>
          Data: Metropolitan Transportation Authority (MTA){" "}
          <a
            href="https://api.mta.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            GTFS-Realtime
          </a>{" "}
          and{" "}
          <a
            href="https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            MTA Subway Stations
          </a>{" "}
          open data. Not affiliated with the MTA. Service may differ from
          posted schedule.
        </p>
      </footer>
    </main>
  );
}
