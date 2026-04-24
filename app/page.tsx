// Always fetch fresh product list — never statically prerender
export const dynamic = 'force-dynamic'

import { NutriLevelBadge } from '@/components/NutriLevelBadge'
import { NutrientBreakdown } from '@/components/NutrientBreakdown'
import { ProductCard } from '@/components/ProductCard'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createServerClient } from '@/lib/supabase/server'
import type { CalcResultOk } from '@/lib/nutrilevel/types'
import type { ProductRow } from '@/lib/supabase/types'

// Fictional sample product — Yakuza-inspired. Do NOT replace with a real brand.
const sampleResult: CalcResultOk = {
  exempt: false,
  level: 'C',
  worstNutrient: 'gula',
  worstDisplayPercent: 10,
  breakdown: {
    gula:      { per100ml: 10.0, displayPercent: 10, level: 'C' },
    natrium:   { per100ml: 60.6, level: 'B' },
    lemakJenuh:{ per100ml: 0,    level: 'A' },
  },
  notes: [],
}

async function getProducts(q?: string): Promise<ProductRow[]> {
  const supabase = createServerClient()

  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (q?.trim()) {
    query = query.ilike('nama', `%${q.trim()}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[page] getProducts:', error.message)
    return []
  }
  return (data ?? []) as ProductRow[]
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function Home({ searchParams }: Props) {
  const { q } = await searchParams
  const products = await getProducts(q)
  const isSearching = !!q?.trim()

  return (
    <main className="flex-1 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 px-4 py-3.5"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-black tracking-tight" style={{ color: 'var(--tx-1)' }}>
              SehatGak?
            </span>
            <span
              className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'var(--border)', color: 'var(--tx-3)' }}
            >
              KMK 301/2026
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center gap-3 pt-2">
          <h1
            className="text-2xl font-black leading-tight tracking-tight"
            style={{ color: 'var(--tx-1)' }}
          >
            Sehat gak<br />minuman ini?
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--tx-2)' }}>
            Scan label gizi minuman dan ketahui Nutri-Level A/B/C/D
            sesuai standar Kemenkes RI.
          </p>
          {/* No JS event handlers — hover via Tailwind arbitrary-value class */}
          <a
            href="/scan"
            className="mt-1 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-sm transition-colors bg-[var(--action)] text-[var(--action-fg)] hover:bg-[var(--action-hi)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Scan Produk
          </a>
        </section>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* ── Search ──────────────────────────────────────────────────── */}
        <form method="GET" action="/" className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5"
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--border)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-3)', flexShrink: 0 }} aria-hidden>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              name="q"
              type="search"
              defaultValue={q ?? ''}
              placeholder="Cari nama produk…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--tx-1)' }}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl px-4 py-2.5 text-sm font-bold transition-colors hover:bg-[var(--surface-hi)]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--tx-1)',
            }}
          >
            Cari
          </button>
          {isSearching && (
            <a
              href="/"
              className="rounded-xl px-3.5 py-2.5 text-sm font-bold flex items-center transition-colors hover:bg-[var(--surface-hi)]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--tx-3)',
              }}
              aria-label="Hapus pencarian"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </a>
          )}
        </form>

        {/* ── Product list ─────────────────────────────────────────────── */}
        {products.length > 0 ? (
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
              {isSearching
                ? `${products.length} hasil untuk "${q}"`
                : 'Produk Terbaru'}
            </p>
            <div className="flex flex-col gap-2">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  nama={p.nama}
                  merek={p.merek}
                  level={p.level}
                  worstNutrient={p.worst_nutrient}
                  worstDisplayPercent={p.worst_display_percent}
                  createdAt={p.created_at}
                />
              ))}
            </div>
          </section>

        ) : isSearching ? (
          <section className="flex flex-col items-center gap-3 py-10 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'var(--surface)' }}
            >
              🔍
            </div>
            <p className="font-bold" style={{ color: 'var(--tx-1)' }}>Produk tidak ditemukan</p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--tx-2)' }}>
              Tidak ada produk dengan nama &ldquo;{q}&rdquo;.
              Scan produknya dan jadilah yang pertama!
            </p>
            <a
              href="/"
              className="mt-1 text-sm underline underline-offset-4"
              style={{ color: 'var(--tx-3)' }}
            >
              Lihat semua produk
            </a>
          </section>

        ) : (
          /* Empty DB — show fictional sample */
          <section className="flex flex-col gap-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-center" style={{ color: 'var(--tx-3)' }}>
              Belum ada produk tersimpan
            </p>
            <div
              className="rounded-2xl px-5 py-5 flex flex-col gap-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--tx-3)' }}>
                  Contoh produk
                </p>
                <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--tx-1)' }}>
                  Naga Dojima Oolong 330ml
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--tx-3)' }}>
                  Kamurocho Drinks Co.
                </p>
              </div>
              <NutriLevelBadge result={sampleResult} />
              <NutrientBreakdown result={sampleResult} />
            </div>
          </section>
        )}

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="px-4 py-4 text-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--tx-3)' }}>
          Berdasarkan KMK HK.01.07/MENKES/301/2026
        </p>
      </footer>

    </main>
  )
}
