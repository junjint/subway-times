import { SubwayBullet } from "./SubwayBullet";
import type { NormalizedArrival } from "@/lib/mta/types";
import { clsx } from "@/lib/util/clsx";

interface Props {
  arrival: NormalizedArrival;
  index: number;
}

function formatMinutes(a: NormalizedArrival): string {
  if (a.isArriving || a.minutesAway <= 0) return "Arriving";
  if (a.minutesAway === 1) return "1 min";
  return `${a.minutesAway} min`;
}

/**
 * A single row on the countdown board. Mimics the look of an LED matrix:
 *   [Bullet]  Destination          5 min
 *
 * Top row gets slightly larger type, matching real platform boards where the
 * next train is emphasized.
 */
export function ArrivalRow({ arrival, index }: Props) {
  const isNext = index === 0;
  const isArriving = arrival.isArriving || arrival.minutesAway <= 0;

  return (
    <li
      className={clsx(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10",
        isNext ? "bg-white/[0.03]" : "bg-transparent",
      )}
    >
      <SubwayBullet route={arrival.routeId} size={isNext ? "lg" : "md"} />
      <div className="min-w-0 flex flex-col">
        <span
          className={clsx(
            "text-white font-bold uppercase truncate leading-tight tracking-tight",
            isNext ? "text-2xl sm:text-4xl" : "text-lg sm:text-2xl",
          )}
          style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        >
          {arrival.destination}
        </span>
        {arrival.directionLabel && (
          <span
            className={clsx(
              "text-mta-gray uppercase tracking-wider",
              isNext ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs",
            )}
          >
            {arrival.directionLabel}
          </span>
        )}
      </div>
      <div
        className={clsx(
          "tabular-nums text-right font-bold leading-none whitespace-nowrap",
          isArriving ? "text-mta-amber" : "text-mta-amber",
          isNext ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl",
          isArriving && "animate-pulse-fade",
        )}
        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        aria-label={`Arrives in ${arrival.minutesAway} minutes`}
      >
        {formatMinutes(arrival)}
      </div>
    </li>
  );
}
