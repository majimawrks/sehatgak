'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sehatgak-disclaimer-v1'

export function DisclaimerModal() {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {}
  }, [])

  function dismiss() {
    setClosing(true)
    // Wait for fade-out animation before unmounting
    setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
      setVisible(false)
      setClosing(false)
    }, 200)
  }

  if (!visible) return null

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          opacity: closing ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
        aria-modal="true"
        role="dialog"
        aria-labelledby="disclaimer-title"
      >
        {/* ── Modal card ──────────────────────────────────────────────── */}
        <div
          className="w-full max-w-sm flex flex-col gap-5 rounded-3xl px-6 py-6"
          style={{
            background: 'var(--surface-hi)',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            transform: closing ? 'translateY(12px) scale(0.97)' : 'translateY(0) scale(1)',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            opacity: closing ? 0 : 1,
          }}
        >

          {/* Header */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
              Sebelum mulai
            </p>
            <h2 id="disclaimer-title" className="text-xl font-black leading-tight tracking-tight" style={{ color: 'var(--tx-1)' }}>
              Catatan penting
            </h2>
          </div>

          {/* Points */}
          <ul className="flex flex-col gap-4">
            <DisclaimerItem
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              color="var(--nutri-b)"
              title="Bukan alat resmi"
              body="SehatGak adalah proyek sampingan pribadi dan tidak berafiliasi dengan Kemenkes, BPOM, atau pihak manapun."
            />
            <DisclaimerItem
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              }
              color="var(--nutri-c)"
              title="Interpretasi pengembang"
              body="Perhitungan Nutri-Level didasarkan pada interpretasi pengembang terhadap KMK HK.01.07/MENKES/301/2026 dan mungkin berbeda dari interpretasi resmi."
            />
            <DisclaimerItem
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              color="var(--nutri-a)"
              title="Alat bantu, bukan keputusan mutlak"
              body="Hasil di sini bersifat indikatif. Gunakan sebagai panduan awal, bukan acuan tunggal dalam keputusan konsumsi."
            />
          </ul>

          {/* Action */}
          <div className="flex flex-col gap-3 pt-1">
            <button
              onClick={dismiss}
              className="w-full rounded-full py-3 font-bold text-sm transition-colors bg-[var(--action)] text-[var(--action-fg)] hover:bg-[var(--action-hi)]"
            >
              Saya mengerti
            </button>

            {/* Feedback form placeholder — uncomment when ready */}
            <p className="text-center text-xs" style={{ color: 'var(--tx-3)' }}>
              Ada masukan? Formulir umpan balik segera hadir.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}

/* ── Helper ──────────────────────────────────────────────────────────────── */

function DisclaimerItem({
  icon,
  color,
  title,
  body,
}: {
  icon: React.ReactNode
  color: string
  title: string
  body: string
}) {
  return (
    <li className="flex gap-3 items-start">
      <div
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
        style={{ background: `color-mix(in srgb, ${color} 15%, var(--surface))`, color }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold leading-snug" style={{ color: 'var(--tx-1)' }}>
          {title}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--tx-2)' }}>
          {body}
        </p>
      </div>
    </li>
  )
}
