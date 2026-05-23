"use client";

import { LedBullet } from "./LedBullet";
import { LedText } from "./LedText";
import { routeStyle } from "@/lib/mta/routeColors";
import type { NormalizedArrival, Station } from "@/lib/mta/types";

interface Props {
  station: Station;
  arrivals: NormalizedArrival[];
  /** Render in skeleton mode (no data yet). */
  loading?: boolean;
}

function formatMinutes(a: NormalizedArrival): string {
  if (a.isArriving || a.minutesAway <= 0) return "Arriving";
  if (a.minutesAway === 1) return "1 min";
  return `${a.minutesAway} min`;
}

/**
 * The hero LED-matrix board, modeled after a wall-mounted MTA-style LED sign
 * inside a wooden frame. Shows up to two upcoming trains.
 *
 * Visual recipe:
 *   1. wood-frame  -> walnut-like CSS frame (no image needed)
 *   2. led-board   -> matte black PCB with off-state LED grid
 *   3. led-mask    -> radial-gradient mask that discretizes the rendered
 *                     content into glowing LED dots
 *   4. underglow   -> faint red+blue blur underneath, like the photo's RGB
 *                     strip on the shelf
 */
export function LedDisplay({ station, arrivals, loading }: Props) {
  const top = arrivals.slice(0, 2);

  return (
    <div className="relative">
      <div className="wood-frame">
        {/* Tiny "wood-burned" branding above the LED panel */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span
            className="text-[10px] sm:text-xs tracking-[0.35em] font-bold uppercase select-none"
            style={{
              color: "#2a1808",
              textShadow: "0 1px 0 rgba(255,220,180,0.18)",
            }}
          >
            ◉ NYC Subway
          </span>
          <span
            className="text-[10px] sm:text-xs tracking-widest uppercase select-none"
            style={{
              color: "#2a1808",
              textShadow: "0 1px 0 rgba(255,220,180,0.18)",
            }}
          >
            Realtime
          </span>
        </div>

        <div
          className="led-board px-5 sm:px-8 py-5 sm:py-7"
          aria-label={`Next trains at ${station.name}`}
        >
          {/* Station name strip across the top */}
          <div className="relative mb-4 sm:mb-5 flex items-center justify-between gap-3">
            <div className="led-mask">
              <LedText
                color="#ffb000"
                font="pixel"
                size={18}
                className="uppercase tracking-widest"
              >
                {station.name}
              </LedText>
            </div>
            <div className="led-mask shrink-0">
              <LedText color="#ff7a00" font="pixel" size={14}>
                {station.borough.toUpperCase()}
              </LedText>
            </div>
          </div>

          {/* Two arrival rows */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {loading || top.length === 0
              ? Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} />)
              : top.map((a, i) => (
                  <LedRow key={`${a.tripId}-${a.stopId}`} arrival={a} index={i} />
                ))}
          </div>

          {/* "After" hint when we have a third train */}
          {!loading && arrivals[2] && (
            <div className="relative mt-5 pt-4 border-t border-white/[0.06]">
              <div className="led-mask flex items-center gap-3">
                <LedText
                  color="#666"
                  font="pixel"
                  size={11}
                  className="uppercase tracking-widest"
                >
                  After
                </LedText>
                <LedText color="#9aa" font="pixel" size={13}>
                  {`${arrivals[2].routeId}`}
                </LedText>
                <LedText color="#9aa" font="pixel" size={13} className="truncate">
                  {arrivals[2].destination}
                </LedText>
                <LedText color="#ffb000" font="pixel" size={13} className="ml-auto">
                  {formatMinutes(arrivals[2])}
                </LedText>
              </div>
            </div>
          )}
        </div>

        {/* Tiny "power-on" LED + branding below the panel */}
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: "#3cff7e",
                boxShadow: "0 0 4px #3cff7e, 0 0 8px #3cff7e",
              }}
              aria-hidden
            />
            <span
              className="text-[9px] sm:text-[10px] tracking-[0.3em] font-bold uppercase select-none"
              style={{ color: "#2a1808" }}
            >
              On
            </span>
          </span>
          <span
            className="text-[9px] sm:text-[10px] tracking-widest uppercase select-none"
            style={{ color: "#2a1808" }}
          >
            MTA · GTFS-RT
          </span>
        </div>
      </div>
      <div className="underglow" aria-hidden />
    </div>
  );
}

function LedRow({ arrival, index }: { arrival: NormalizedArrival; index: number }) {
  const style = routeStyle(arrival.routeId);
  const isArriving = arrival.isArriving || arrival.minutesAway <= 0;
  const isFirst = index === 0;
  // Yellow trains (N/Q/R/W) read poorly as text; use a brighter shade.
  const destColor =
    style.bg === "#FCCC0A" ? "#fff070" : brightenForLed(style.bg);
  const minutesColor = isArriving ? "#ff4040" : "#ffffff";

  return (
    <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-5">
      <div className="led-mask">
        <LedBullet route={arrival.routeId} size={isFirst ? 72 : 56} />
      </div>

      <div className="min-w-0">
        <div className="led-mask">
          <LedText
            color={destColor}
            font="pixel"
            size={isFirst ? 38 : 30}
            marqueeOnOverflow
            className="block w-full"
          >
            {arrival.destination}
          </LedText>
        </div>
        {arrival.directionLabel && (
          <div className="led-mask mt-1.5">
            <LedText
              color="#888"
              font="pixel"
              size={12}
              className="uppercase tracking-widest"
            >
              {arrival.directionLabel}
            </LedText>
          </div>
        )}
      </div>

      <div className="led-mask shrink-0">
        <LedText
          color={minutesColor}
          font="pixel"
          size={isFirst ? 34 : 28}
          className={isArriving ? "led-flash" : ""}
        >
          {formatMinutes(arrival)}
        </LedText>
      </div>
    </div>
  );
}

/**
 * Most MTA route colors are designed for white print backgrounds; on a dark
 * LED panel they look muddy. Boost lightness slightly so dots pop.
 */
function brightenForLed(hex: string): string {
  // The official palette is already vivid; a small tint toward white is all
  // we need. Skipping a full HSL parse - just blend 12% white.
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.18));
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
}

function SkeletonRow() {
  return (
    <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-5 opacity-60">
      <div className="led-mask">
        <div className="w-14 h-14 rounded-full bg-white/15 animate-pulse" />
      </div>
      <div className="min-w-0">
        <div className="led-mask">
          <LedText color="#333" font="pixel" size={30}>
            ----- ----- --
          </LedText>
        </div>
      </div>
      <div className="led-mask shrink-0">
        <LedText color="#333" font="pixel" size={28}>
          -- min
        </LedText>
      </div>
    </div>
  );
}
