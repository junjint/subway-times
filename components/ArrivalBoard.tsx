"use client";

import { useMemo, useState } from "react";
import type { ArrivalsResponse, StationDirection } from "@/lib/mta/types";
import { ArrivalRow } from "./ArrivalRow";
import { clsx } from "@/lib/util/clsx";

interface Props {
  data: ArrivalsResponse;
  maxRows?: number;
}

/**
 * The countdown board itself.
 *
 * Lets the user filter by direction (N / S) and caps to a reasonable number
 * of rows so the board never scrolls off-screen on a phone.
 */
export function ArrivalBoard({ data, maxRows = 12 }: Props) {
  const [direction, setDirection] = useState<"all" | StationDirection>("all");

  const { station, arrivals } = data;
  const filtered = useMemo(() => {
    let list = arrivals;
    if (direction !== "all") list = list.filter((a) => a.direction === direction);
    return list.slice(0, maxRows);
  }, [arrivals, direction, maxRows]);

  const nLabel = station.directionLabels.N || "Northbound";
  const sLabel = station.directionLabels.S || "Southbound";

  return (
    <section className="bg-mta-panel border border-white/10 rounded-lg overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40">
        <h2 className="text-mta-gray uppercase text-xs sm:text-sm tracking-[0.25em] font-medium">
          Next Trains
        </h2>
        <div
          role="tablist"
          aria-label="Filter arrivals by direction"
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <DirButton active={direction === "all"} onClick={() => setDirection("all")}>
            All
          </DirButton>
          <DirButton active={direction === "N"} onClick={() => setDirection("N")}>
            {nLabel}
          </DirButton>
          <DirButton active={direction === "S"} onClick={() => setDirection("S")}>
            {sLabel}
          </DirButton>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyBoard />
      ) : (
        <ul className="divide-y divide-white/0">
          {filtered.map((a, i) => (
            <ArrivalRow key={`${a.tripId}-${a.stopId}-${a.arrivalTime}`} arrival={a} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DirButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        "px-3 py-1.5 rounded uppercase tracking-wider font-medium transition-colors",
        active
          ? "bg-mta-amber text-black"
          : "text-mta-gray hover:text-white hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}

function EmptyBoard() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-mta-amber text-2xl font-bold uppercase tracking-wider">
        No upcoming trains
      </p>
      <p className="text-mta-gray mt-2 text-sm">
        Either service is suspended at this station or the feed has no
        scheduled arrivals right now. Try again in 30 seconds.
      </p>
    </div>
  );
}
