// Always fetch fresh product list — never statically prerender
export const dynamic = 'force-dynamic'

import { NutriLevelBadge } from '@/components/NutriLevelBadge'
import { NutrientBreakdown } from '@/components/NutrientBreakdown'
import { ProductCard } from '@/components/ProductCard'
import { createServerClient } from '@/lib/supabase/server'
import type { CalcResultOk } from '@/lib/nutrilevel/types'
import type { ProductRow } from '@/lib/supabase/types'

// Sample result for visual reference — shows how the badge looks for Level C.
// Represents: teh botol 330ml, 41g gula, 8g laktosa, 200mg natrium, 0g lemak
const sampleResult: CalcResultOk = {
  exempt: false,
  level: 'C',
  worstNutrient: 'gula',
  worstDisplayPercent: 10,
  breakdown: {
    gula: { per100ml: 10.0, displayPercent: 10, level: 'C' },
    natrium: { per100ml: 60.6, level: 'B' },
    lemakJenuh: { per100ml: 0, level: 'A' },
  },
  notes: [],
}

async function getRecentProducts(): Promise<ProductRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[page] getRecentProducts:', error.message)
    return []
  }

  return (data ?? []) as ProductRow[]
}

export default async function Home() {
  const products = await getRecentProducts()

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">SehatGak?</span>
          <span className="text-xs text-gray-400">KMK 301/2026</span>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-8">

        {/* Hero CTA */}
        <section className="flex flex-col items-center text-center gap-4">
          <h1 className="text-2xl font-black leading-tight">
            Sehat gak<br />minuman ini?
          </h1>
          <p className="text-gray-500 text-sm">
            Scan label gizi minuman dan ketahui Nutri-Level-nya<br />
            sesuai standar Kemenkes RI.
          </p>
          <a
            href="/scan"
            className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-3 text-white font-bold text-sm"
            style={{ backgroundColor: 'var(--nutri-a)' }}
          >
            <span>📷</span>
            <span>Scan Produk</span>
          </a>
        </section>

        <div className="border-t border-gray-100" />

        {/* Recent products from DB */}
        {products.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
              Produk Terbaru
            </h2>
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
        ) : (
          <section className="flex flex-col gap-6">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold text-center">
              Belum ada produk tersimpan
            </p>

            {/* Sample result shown when DB is empty */}
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Contoh Produk
              </p>
              <h2 className="text-lg font-black">Teh Botol 330ml</h2>
              <p className="text-sm text-gray-500 mb-2">Sosro</p>
              <NutriLevelBadge result={sampleResult} />
              <div className="mt-4">
                <NutrientBreakdown result={sampleResult} />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-4 py-4 text-center">
        <p className="text-xs text-gray-400">
          Berdasarkan KMK HK.01.07/MENKES/301/2026
        </p>
      </footer>
    </main>
  )
}
