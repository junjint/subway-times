import { SubwayBullet } from "./SubwayBullet";
import type { Station } from "@/lib/mta/types";

interface Props {
  station: Station;
}

/**
 * Big "platform pylon" header at the top of the board: station name on top,
 * subway bullets for every route that serves the station underneath.
 */
export function StationHeader({ station }: Props) {
  return (
    <header className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-none uppercase">
          {station.name}
        </h1>
        <span className="text-sm sm:text-base font-medium text-mta-gray uppercase tracking-wider">
          {station.borough}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {station.routes.map((r) => (
          <SubwayBullet key={r} route={r} size="md" />
        ))}
        {station.routes.length === 0 && (
          <span className="text-mta-gray text-sm italic">No daytime service</span>
        )}
      </div>
    </header>
  );
}
