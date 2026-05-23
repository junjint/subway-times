import { routeStyle } from "@/lib/mta/routeColors";

interface Props {
  route: string;
  /** Size in CSS pixels. Defaults to 56. */
  size?: number;
}

/**
 * LED-matrix subway bullet. Looks like a real LED-sign route circle:
 *   - The disc is the route color (renders as glowing LEDs through .led-mask)
 *   - The letter is rendered "darker" - in real LED signs the letter is the
 *     OFF pixels inside a circle of ON pixels, so we use a darker shade of
 *     the route color rather than white. Comes out clearly readable.
 */
export function LedBullet({ route, size = 56 }: Props) {
  const style = routeStyle(route);
  const isDiamond = style.shape === "diamond";

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 relative"
      style={{ width: size, height: size }}
      aria-label={`${style.label} train`}
      role="img"
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: style.bg,
          borderRadius: isDiamond ? "12%" : "9999px",
          transform: isDiamond ? "rotate(45deg)" : "none",
          boxShadow: `0 0 0 1px ${style.bg}, 0 0 ${size * 0.25}px ${style.bg}aa`,
        }}
      />
      <span
        className="relative font-chunky leading-none select-none"
        style={{
          color: "#000",
          fontSize: size * 0.5,
          // Optical center
          marginTop: size * 0.04,
          textShadow: "0 0 1px rgba(0,0,0,0.6)",
        }}
      >
        {style.label}
      </span>
    </span>
  );
}
