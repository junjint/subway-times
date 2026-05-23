"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clsx } from "@/lib/util/clsx";

interface Props {
  children: string;
  color?: string;
  /** "pixel" = Silkscreen 5x7, "chunky" = Press Start 2P 8x8. */
  font?: "pixel" | "chunky";
  className?: string;
  /** Style fontSize override (number = px). */
  size?: number;
  /** If true, animates horizontal scroll when text overflows its container. */
  marqueeOnOverflow?: boolean;
}

// useLayoutEffect on the server warns; alias to useEffect for SSR.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A run of LED-style text. If `marqueeOnOverflow` is set, measures the text
 * against its container after layout and starts a slow scroll animation only
 * when it doesn't fit.
 *
 * The dot-mask is applied by the parent .led-mask wrapper, so this component
 * doesn't apply any mask itself - it just renders bright glowing pixel text.
 */
export function LedText({
  children,
  color = "#ffffff",
  font = "pixel",
  className,
  size,
  marqueeOnOverflow,
}: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);

  useIsoLayoutEffect(() => {
    if (!marqueeOnOverflow) return;
    const measure = () => {
      const c = containerRef.current;
      const i = innerRef.current;
      if (!c || !i) return;
      const overflow = i.scrollWidth - c.clientWidth;
      setOverflowPx(overflow > 4 ? overflow + 16 : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [children, marqueeOnOverflow, size]);

  const isMarquee = marqueeOnOverflow && overflowPx > 0;
  // ~40px per second feels right - matches real station LED scroll speed.
  const duration = isMarquee ? Math.max(5, overflowPx / 40 + 2) : 0;

  const style: React.CSSProperties = {
    color,
    fontFamily:
      font === "chunky"
        ? "var(--font-press-start), monospace"
        : "var(--font-silkscreen), monospace",
    fontSize: size,
    letterSpacing: font === "chunky" ? "0.05em" : "0.02em",
    lineHeight: 1,
    // Always keep text on a single line - LED scroller boards don't wrap.
    // When the text doesn't fit, the marquee animation scrolls it.
    whiteSpace: "nowrap",
    // Wider, brighter halo so the lit dots bloom into the surrounding
    // black pixels - same effect as a real LED panel viewed in the dark.
    textShadow: `0 0 5px ${color}, 0 0 14px ${color}cc, 0 0 24px ${color}55`,
    ["--marquee-distance" as string]: `${overflowPx}px`,
    ["--marquee-duration" as string]: `${duration}s`,
  };

  return (
    <span
      ref={containerRef}
      className={clsx("relative inline-block overflow-hidden align-middle", className)}
      style={{ maxWidth: "100%" }}
    >
      <span
        ref={innerRef}
        className={clsx(isMarquee && "led-marquee")}
        style={style}
      >
        {children}
      </span>
    </span>
  );
}
