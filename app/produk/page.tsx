export const dynamic = 'force-dynamic'

import { ProductCard } from '@/components/ProductCard'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createServerClient } from '@/lib/supabase/server'
import { CATEGORY_LABEL } from '@/lib/supabase/types'
import type { ProductRow, Category } from '@/lib/supabase/types'

// ── Types ──────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = ['semua', 'minuman', 'snack', 'makanan', 'lainnya'] as const
type KategoriFilter = typeof ALL_CATEGORIES[number]

const PER_PAGE_OPTIONS = [10, 15, 25] as const
type PerPage = typeof PER_PAGE_OPTIONS[number]

// ── Category accent colors ──────────────────────────────────────────────────

const CATEGORY_ACCENT: Record<KategoriFilter, { bg: string; fg: string }> = {
  semua:   { bg: 'var(--tx-1)',  fg: 'var(--bg)' },
  minuman: { bg: 'var(--action)', fg: '#fff' },
  snack:   { bg: '#D4850A',      fg: '#fff' },
  makanan: { bg: '#5563B0',      fg: '#fff' },
  lainnya: { bg: 'var(--tx-2)',  fg: '#fff' },
}

// ── Data fetching ───────────────────────────────────────────────────────────

async function getProducts(
  kategori: KategoriFilter,
  page: number,
  per: PerPage,
): Promise<{ products: ProductRow[]; total: number }> {
  const supabase = createServerClient()
  const offset = (page - 1) * per

  let countQuery = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })

  let dataQuery = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + per - 1)

  if (kategori !== 'semua') {
    countQuery = countQuery.eq('category', kategori)
    dataQuery  = dataQuery.eq('category',  kategori)
  }

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery])

  if (error) {
    console.error('[produk] getProducts:', error.message)
    return { products: [], total: 0 }
  }

  return {
    products: (data ?? []) as ProductRow[],
    total: count ?? 0,
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{ kategori?: string; halaman?: string; per?: string }>
}

export default async function ProdukPage({ searchParams }: Props) {
  const params = await searchParams

  const rawKat = params.kategori ?? 'semua'
  const kategori: KategoriFilter = (ALL_CATEGORIES as readonly string[]).includes(rawKat)
    ? (rawKat as KategoriFilter)
    : 'semua'

  const rawPer = parseInt(params.per ?? '10', 10)
  const per: PerPage = (PER_PAGE_OPTIONS as readonly number[]).includes(rawPer)
    ? (rawPer as PerPage)
    : 10

  const rawPage = parseInt(params.halaman ?? '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const { products, total } = await getProducts(kategori, page, per)
  const totalPages = Math.max(1, Math.ceil(total / per))
  const safePage = Math.min(page, totalPages)

  function buildUrl(overrides: Partial<{ kategori: KategoriFilter; halaman: number; per: number }>): string {
    const k = overrides.kategori ?? kategori
    const h = overrides.halaman  ?? safePage
    const r = overrides.per      ?? per
    const qs = new URLSearchParams()
    if (k !== 'semua') qs.set('kategori', k)
    if (h > 1) qs.set('halaman', String(h))
    if (r !== 10) qs.set('per', String(r))
    const s = qs.toString()
    return `/produk${s ? `?${s}` : ''}`
  }

  const prevDisabled = safePage <= 1
  const nextDisabled = safePage >= totalPages

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
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-[var(--surface-hi)]"
              style={{ color: 'var(--tx-3)' }}
              aria-label="Kembali ke beranda"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </a>
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--tx-1)' }}>
              Semua Produk
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">

        {/* ── Category filter ─────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
          {ALL_CATEGORIES.map(cat => {
            const isActive = cat === kategori
            const label = cat === 'semua' ? 'Semua' : CATEGORY_LABEL[cat as Category]
            const accent = CATEGORY_ACCENT[cat]
            return (
              <a
                key={cat}
                href={buildUrl({ kategori: cat, halaman: 1 })}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all"
                style={isActive
                  ? { background: accent.bg, color: accent.fg }
                  : {
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--tx-2)',
                    }
                }
              >
                {label}
              </a>
            )
          })}
        </div>

        {/* ── Controls row ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm" style={{ color: 'var(--tx-3)' }}>
            <span className="font-bold tabular-nums" style={{ color: 'var(--tx-1)' }}>
              {total}
            </span>{' '}
            produk
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--tx-3)' }}>Tampilkan:</span>
            {PER_PAGE_OPTIONS.map(n => (
              <a
                key={n}
                href={buildUrl({ per: n, halaman: 1 })}
                className="rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
                style={n === per
                  ? { background: 'var(--tx-1)', color: 'var(--bg)' }
                  : {
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--tx-2)',
                    }
                }
              >
                {n}
              </a>
            ))}
          </div>
        </div>

        {/* ── Product list ────────────────────────────────────────────── */}
        {products.length > 0 ? (
          <div className="flex flex-col gap-2">
            {products.map(p => (
              <ProductCard
                key={p.id}
                id={p.id}
                nama={p.nama}
                merek={p.merek}
                category={p.category}
                level={p.level}
                worstNutrient={p.worst_nutrient}
                worstDisplayPercent={p.worst_display_percent}
                createdAt={p.created_at}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'var(--surface)' }}
            >
              📭
            </div>
            <p className="font-bold" style={{ color: 'var(--tx-1)' }}>Belum ada produk</p>
            <p className="text-sm" style={{ color: 'var(--tx-2)' }}>
              {kategori === 'semua'
                ? 'Belum ada produk tersimpan.'
                : `Belum ada produk dalam kategori ${CATEGORY_LABEL[kategori as Category]}.`}
            </p>
            {kategori !== 'semua' ? (
              <a
                href="/produk"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-70"
                style={{ color: 'var(--action)' }}
              >
                Lihat semua kategori
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <a
                href="/scan"
                className="mt-1 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-colors bg-[var(--action)] text-[var(--action-fg)] hover:bg-[var(--action-hi)]"
              >
                Scan Produk Pertama
              </a>
            )}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1 mt-auto">
            {/* Prev */}
            {prevDisabled ? (
              <span
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold select-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--tx-3)',
                  opacity: 0.4,
                }}
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Sebelumnya
              </span>
            ) : (
              <a
                href={buildUrl({ halaman: safePage - 1 })}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors hover:bg-[var(--surface-hi)]"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--tx-1)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Sebelumnya
              </a>
            )}

            {/* Page indicator */}
            <span className="text-sm tabular-nums" style={{ color: 'var(--tx-3)' }}>
              <span className="font-bold" style={{ color: 'var(--tx-1)' }}>{safePage}</span>
              {' / '}
              {totalPages}
            </span>

            {/* Next */}
            {nextDisabled ? (
              <span
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold select-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--tx-3)',
                  opacity: 0.4,
                }}
                aria-hidden
              >
                Berikutnya
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            ) : (
              <a
                href={buildUrl({ halaman: safePage + 1 })}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors hover:bg-[var(--surface-hi)]"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--tx-1)',
                }}
              >
                Berikutnya
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
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
