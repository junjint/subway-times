interface Props {
  message: string;
  onRetry?: () => void;
}

/**
 * Big "service advisory" style error panel in MTA-amber so the user knows
 * something needs attention without the page feeling broken.
 */
export function ErrorState({ message, onRetry }: Props) {
  return (
    <section
      role="alert"
      className="bg-amber-50 border border-amber-300 rounded-lg overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-3 border-b border-amber-200 bg-amber-100 flex items-center gap-3">
        <span aria-hidden className="text-amber-700 text-xl leading-none">
          ⚠
        </span>
        <h2 className="text-amber-800 uppercase text-sm sm:text-base tracking-[0.25em] font-bold">
          Service Advisory
        </h2>
      </div>
      <div className="px-6 py-10 text-center">
        <p className="text-neutral-900 text-xl sm:text-2xl font-bold uppercase mb-2">
          Unable to load arrivals
        </p>
        <p className="text-neutral-600 text-sm sm:text-base mb-6 max-w-lg mx-auto">
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-amber-500 text-white font-bold uppercase tracking-wider rounded text-sm hover:bg-amber-600 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
