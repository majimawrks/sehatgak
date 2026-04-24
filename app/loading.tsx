// Skeleton shown while the landing page server component fetches products.
// Mirrors the page structure to prevent layout jump on load.
export default function Loading() {
  return (
    <main className="flex-1 flex flex-col">

      <header
        className="sticky top-0 z-10 px-4 py-3.5"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-lg font-black tracking-tight" style={{ color: 'var(--tx-1)' }}>
            SehatGak?
          </span>
          <div className="w-8 h-8 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* Hero skeleton */}
        <section className="flex flex-col items-center gap-3 pt-2">
          <div className="h-8 w-52 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-64 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="mt-1 h-9 w-32 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
        </section>

        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* Search bar skeleton */}
        <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />

        {/* Product list skeleton */}
        <section className="flex flex-col gap-3">
          <div className="h-3 w-28 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-40 rounded animate-pulse" style={{ background: 'var(--border)' }} />
                  <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--border-lo)' }} />
                </div>
                <div className="w-10 h-10 rounded-lg animate-pulse ml-4" style={{ background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        </section>

      </div>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--tx-3)' }}>
          Berdasarkan KMK HK.01.07/MENKES/301/2026
        </p>
      </footer>

    </main>
  )
}
