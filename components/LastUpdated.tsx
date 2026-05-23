"use client";

import { useEffect, useState } from "react";
import { clsx } from "@/lib/util/clsx";

interface Props {
  updatedAt: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  source?: "gtfs-rt" | "fallback";
}

function formatRelative(now: number, then: number): string {
  const diff = Math.max(0, Math.round((now - then) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m < 60) return s === 0 ? `${m}m ago` : `${m}m ${s}s ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/**
 * "Last updated 12s ago" with a manual refresh button. Re-renders every
 * second so the text stays current between polls.
 */
export function LastUpdated({ updatedAt, isRefreshing, onRefresh, source }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const label = updatedAt
    ? formatRelative(Date.now(), new Date(updatedAt).getTime())
    : "never";

  const isFallback = source === "fallback";

  return (
    <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-600">
      <span className="inline-flex items-center gap-2">
        <span
          className={clsx(
            "h-2 w-2 rounded-full",
            isFallback
              ? "bg-red-500"
              : isRefreshing
              ? "bg-amber-500 animate-pulse"
              : "bg-emerald-600",
          )}
          aria-hidden
        />
        <span className="uppercase tracking-wider font-medium text-neutral-700">
          {isFallback ? "Demo data" : "Live"}
        </span>
      </span>
      <span aria-live="polite">Updated {label}</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className={clsx(
          "ml-1 px-2.5 py-1 rounded border border-neutral-300 text-neutral-900 hover:bg-neutral-100 transition-colors text-xs uppercase tracking-wider",
          isRefreshing && "opacity-60 cursor-wait",
        )}
        aria-label="Refresh arrivals now"
      >
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
