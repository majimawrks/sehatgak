'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error boundary]', error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 gap-5 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'var(--surface)' }}
      >
        ⚠️
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--tx-1)' }}>
          Terjadi kesalahan
        </h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--tx-2)' }}>
          Gagal memuat halaman. Coba lagi atau kembali beberapa saat nanti.
        </p>
      </div>
      <div className="flex gap-3 mt-1">
        <button
          onClick={reset}
          className="rounded-full px-5 py-2.5 font-bold text-sm transition-colors"
          style={{ background: 'var(--action)', color: 'var(--action-fg)' }}
        >
          Coba Lagi
        </button>
        <a
          href="/"
          className="rounded-full px-5 py-2.5 font-bold text-sm transition-colors"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--tx-1)',
            background: 'var(--surface)',
          }}
        >
          Ke Beranda
        </a>
      </div>
    </main>
  )
}
