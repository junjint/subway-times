/**
 * Skeleton-style loader styled to look like the countdown board so the
 * transition into real data feels smooth (no layout shift).
 */
export function LoadingState() {
  return (
    <section
      className="bg-mta-panel border border-white/10 rounded-lg overflow-hidden"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40">
        <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-6 w-40 bg-white/5 rounded animate-pulse" />
      </div>
      <ul>
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 py-4 border-b border-white/10"
          >
            <div
              className="rounded-full bg-white/10 animate-pulse"
              style={{ width: i === 0 ? 56 : 36, height: i === 0 ? 56 : 36 }}
            />
            <div className="flex flex-col gap-2 min-w-0">
              <div
                className="h-6 bg-white/10 rounded animate-pulse"
                style={{ width: `${50 + ((i * 13) % 30)}%` }}
              />
              <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
            </div>
            <div
              className="h-8 w-24 bg-white/10 rounded animate-pulse"
              style={{ height: i === 0 ? 40 : 28 }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
