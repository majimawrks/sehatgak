export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 gap-5 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'var(--surface)' }}
      >
        🔍
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--tx-1)' }}>
          Halaman tidak ditemukan
        </h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--tx-2)' }}>
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <a
        href="/"
        className="mt-1 rounded-full px-5 py-2.5 font-bold text-sm transition-colors"
        style={{ background: 'var(--action)', color: 'var(--action-fg)' }}
      >
        Ke Beranda
      </a>
    </main>
  )
}
