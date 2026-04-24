import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { calculateLevel } from '@/lib/nutrilevel'
import { NutriLevelBadge } from '@/components/NutriLevelBadge'
import { NutrientBreakdown } from '@/components/NutrientBreakdown'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { ProductRow, Level } from '@/lib/supabase/types'
import type { CalcResultOk } from '@/lib/nutrilevel/types'

async function getProduct(id: string): Promise<ProductRow | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as ProductRow
}

function productToCalcResult(p: ProductRow): CalcResultOk | null {
  if (p.gula_total_g == null || p.natrium_mg == null || p.lemak_jenuh_g == null) return null
  const result = calculateLevel({
    gulaTotalGram:          p.gula_total_g,
    laktosaGram:            p.laktosa_g ?? undefined,
    natriumMg:              p.natrium_mg,
    lemakJenuhGram:         p.lemak_jenuh_g,
    takaranSajiMl:          p.takaran_saji_ml,
    hasSweetenerAdditive:   p.has_sweetener_additive ?? false,
    hasOnlyNaturalSweetener:p.has_only_natural_sweetener ?? false,
  })
  if (result.exempt) return null
  return result
}

const LEVEL_COLORS: Record<Level, string> = {
  A: 'var(--nutri-a)',
  B: 'var(--nutri-b)',
  C: 'var(--nutri-c)',
  D: 'var(--nutri-d)',
}

const NEEDS_DARK_TEXT = new Set<Level>(['B', 'C'])

type Props = { params: Promise<{ id: string }> }

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const result = productToCalcResult(product)

  const addedDate = new Date(product.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

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
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-1 text-sm font-semibold transition-colors"
              style={{ color: 'var(--tx-3)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Kembali
            </a>
            <span className="text-[var(--border)]">|</span>
            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--tx-1)' }}>
              Detail Produk
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* ── Product identity ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-black leading-tight tracking-tight" style={{ color: 'var(--tx-1)' }}>
            {product.nama}
          </h1>
          {product.merek && (
            <p className="text-sm font-medium" style={{ color: 'var(--tx-2)' }}>{product.merek}</p>
          )}
          <p className="text-xs mt-0.5" style={{ color: 'var(--tx-3)' }}>
            Takaran saji {product.takaran_saji_ml} ml
          </p>
        </div>

        {/* ── Nutri-Level ──────────────────────────────────────────────── */}
        {result ? (
          <div className="flex flex-col gap-4">
            <NutriLevelBadge result={result} />
            <NutrientBreakdown result={result} />
          </div>
        ) : (
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex items-center justify-center rounded-lg font-black text-lg shrink-0"
              style={{
                backgroundColor: LEVEL_COLORS[product.level],
                color: NEEDS_DARK_TEXT.has(product.level) ? '#1B1916' : '#FFFFFF',
                width: '2.75rem',
                height: '2.75rem',
              }}
            >
              {product.level}
            </div>
            <p className="text-sm" style={{ color: 'var(--tx-2)' }}>
              Detail nilai gizi tidak tersedia untuk produk ini.
            </p>
          </div>
        )}

        <div style={{ height: '1px', background: 'var(--border)' }} />

        {/* ── Raw nutrition values ─────────────────────────────────────── */}
        <div
          className="rounded-2xl px-4 py-4 flex flex-col gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
            Nilai Gizi per Saji ({product.takaran_saji_ml} ml)
          </p>
          <div className="grid grid-cols-2 gap-y-2.5 text-sm">
            {product.gula_total_g != null && (
              <>
                <span style={{ color: 'var(--tx-2)' }}>Gula total</span>
                <span className="font-semibold text-right" style={{ color: 'var(--tx-1)' }}>{product.gula_total_g} g</span>
              </>
            )}
            {product.laktosa_g != null && (
              <>
                <span style={{ color: 'var(--tx-2)' }}>Laktosa</span>
                <span className="font-semibold text-right" style={{ color: 'var(--tx-1)' }}>{product.laktosa_g} g</span>
              </>
            )}
            {product.natrium_mg != null && (
              <>
                <span style={{ color: 'var(--tx-2)' }}>Natrium</span>
                <span className="font-semibold text-right" style={{ color: 'var(--tx-1)' }}>{product.natrium_mg} mg</span>
              </>
            )}
            {product.lemak_jenuh_g != null && (
              <>
                <span style={{ color: 'var(--tx-2)' }}>Lemak jenuh</span>
                <span className="font-semibold text-right" style={{ color: 'var(--tx-1)' }}>{product.lemak_jenuh_g} g</span>
              </>
            )}
            {product.has_sweetener_additive && (
              <>
                <span style={{ color: 'var(--tx-2)' }}>Pemanis tambahan</span>
                <span className="font-semibold text-right" style={{ color: 'var(--tx-1)' }}>
                  {product.has_only_natural_sweetener ? 'Hanya alami' : 'Ada'}
                </span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--tx-3)' }}>
          Ditambahkan {addedDate}
        </p>

      </div>
    </main>
  )
}
