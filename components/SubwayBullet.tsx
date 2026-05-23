import { routeStyle } from "@/lib/mta/routeColors";
import { clsx } from "@/lib/util/clsx";

interface Props {
  route: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
}

const SIZE_PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 24,
  md: 36,
  lg: 56,
};
const FONT_PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 14,
  md: 20,
  lg: 32,
};

/**
 * The classic MTA "bullet" — a colored circle (or diamond for express) with
 * the route letter or number centered inside it. We render as inline-block
 * so it sits naturally next to text.
 */
export function SubwayBullet({ route, size = "md", className, title }: Props) {
  const style = routeStyle(route);
  const px = SIZE_PX[size];
  const fontPx = FONT_PX[size];
  const isDiamond = style.shape === "diamond";

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center align-middle select-none font-bold leading-none shrink-0",
        className,
      )}
      style={{ width: px, height: px }}
      title={title ?? `${style.label} train`}
      aria-label={`${style.label} train`}
      role="img"
    >
      <span
        className={clsx(
          "flex items-center justify-center",
          isDiamond ? "rotate-45" : "rounded-full",
        )}
        style={{
          width: px,
          height: px,
          backgroundColor: style.bg,
          borderRadius: isDiamond ? "10%" : "9999px",
        }}
      >
        <span
          className="font-bold"
          style={{
            color: style.fg,
            fontSize: fontPx,
            transform: isDiamond ? "rotate(-45deg)" : "none",
            fontFamily:
              "'Helvetica Neue', Helvetica, Arial, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          {style.label}
        </span>
      </span>
    </span>
  );
}
