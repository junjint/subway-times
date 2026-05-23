"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { SubwayBullet } from "./SubwayBullet";
import type { Station } from "@/lib/mta/types";
import { clsx } from "@/lib/util/clsx";

interface Props {
  stations: Station[];
  selectedStationId: string | null;
  onSelect: (station: Station) => void;
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function matchScore(station: Station, q: string): number {
  if (!q) return 1;
  const needle = q.toLowerCase().trim();
  if (!needle) return 1;
  const name = station.name.toLowerCase();
  const borough = station.borough.toLowerCase();
  const routesStr = station.routes.join(" ").toLowerCase();

  // Strong: exact route match (e.g. user types "M")
  if (station.routes.some((r) => r.toLowerCase() === needle)) return 5;
  // Strong: name startsWith
  if (name.startsWith(needle)) return 4;
  // Medium: word boundary in name
  if (new RegExp(`\\b${escapeRegex(needle)}`, "i").test(station.name)) return 3;
  // Weak: substring in name
  if (name.includes(needle)) return 2;
  // Borough or route substring
  if (borough.includes(needle)) return 1.5;
  if (routesStr.includes(needle)) return 1.2;
  return 0;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Autocomplete-style station selector. Combobox pattern, keyboard accessible:
 *   ↑ / ↓   move highlight
 *   Enter   select highlighted
 *   Escape  close dropdown
 *   Tab     close dropdown (no select)
 */
export function StationSearch({ stations, selectedStationId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 120);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = useMemo(
    () => stations.find((s) => s.gtfsStopId === selectedStationId) ?? null,
    [stations, selectedStationId],
  );

  const results = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      // Show the selected one first, then the rest alphabetically (already sorted upstream)
      return stations.slice(0, 50);
    }
    const scored: { s: Station; score: number }[] = [];
    for (const s of stations) {
      const score = matchScore(s, q);
      if (score > 0) scored.push({ s, score });
    }
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.s.name.localeCompare(b.s.name);
    });
    return scored.slice(0, 50).map((x) => x.s);
  }, [stations, debouncedQuery]);

  useEffect(() => {
    setHighlight(0);
  }, [debouncedQuery, open]);

  const handleSelect = useCallback(
    (s: Station) => {
      onSelect(s);
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && results[highlight]) {
        e.preventDefault();
        handleSelect(results[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    } else if (e.key === "Home") {
      setHighlight(0);
    } else if (e.key === "End") {
      setHighlight(results.length - 1);
    }
  };

  // Click-outside to close
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const inputValue = open
    ? query
    : selected
    ? `${selected.name}${selected.borough ? ` — ${selected.borough}` : ""}`
    : query;

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-neutral-500 uppercase text-xs tracking-[0.2em] mb-1.5 font-medium">
        Station
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-activedescendant={open && results[highlight] ? `${listboxId}-opt-${highlight}` : undefined}
          placeholder="Search by station, route, or borough…"
          value={inputValue}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="w-full bg-white border border-neutral-300 rounded-md px-4 py-3 text-neutral-900 text-base sm:text-lg placeholder:text-neutral-400 focus:outline-none focus:border-[#14271b] focus:ring-2 focus:ring-[#14271b]/25 shadow-sm"
          autoComplete="off"
          spellCheck={false}
        />
        {open && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 text-xs px-2 py-1 rounded"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-2 max-h-[60vh] overflow-y-auto bg-white border border-neutral-200 rounded-md shadow-2xl"
        >
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-neutral-400 text-sm">
              No matching stations.
            </li>
          ) : (
            results.map((s, i) => (
              <li
                key={s.gtfsStopId}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  // Prevent the input blur racing the click.
                  e.preventDefault();
                  handleSelect(s);
                }}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-neutral-100 last:border-b-0",
                  i === highlight ? "bg-neutral-100" : "hover:bg-neutral-50",
                )}
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  {s.routes.slice(0, 6).map((r) => (
                    <SubwayBullet key={r} route={r} size="sm" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-neutral-900 font-semibold truncate">{s.name}</div>
                  <div className="text-neutral-500 text-xs uppercase tracking-wider truncate">
                    {s.borough}
                    {s.line ? ` · ${s.line}` : ""}
                  </div>
                </div>
                {selectedStationId === s.gtfsStopId && (
                  <span
                    className="text-xs uppercase tracking-wider shrink-0 font-medium"
                    style={{ color: "#14271b" }}
                  >
                    Selected
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
