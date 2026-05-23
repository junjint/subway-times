/**
 * Skeleton-style loader styled to look like the countdown board so the
 * transition into real data feels smooth (no layout shift).
 */
export function LoadingState() {
  return (
    <section
      className="bg-neutral-100 border border-neutral-200 rounded-lg overflow-hidden"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-200 bg-neutral-50">
        <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse" />
        <div className="h-6 w-40 bg-neutral-200 rounded animate-pulse" />
      </div>
      <ul>
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 py-4 border-b border-neutral-200 last:border-b-0"
          >
            <div
              className="rounded-full bg-neutral-200 animate-pulse"
              style={{ width: i === 0 ? 56 : 36, height: i === 0 ? 56 : 36 }}
            />
            <div className="flex flex-col gap-2 min-w-0">
              <div
                className="h-6 bg-neutral-200 rounded animate-pulse"
                style={{ width: `${50 + ((i * 13) % 30)}%` }}
              />
              <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse" />
            </div>
            <div
              className="h-8 w-24 bg-neutral-200 rounded animate-pulse"
              style={{ height: i === 0 ? 40 : 28 }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
