import { NutriLevelBadge } from '@/components/NutriLevelBadge'
import { NutrientBreakdown } from '@/components/NutrientBreakdown'
import type { CalcResultOk } from '@/lib/nutrilevel/types'

// Sample result for Phase 2 visual verification.
// Represents: teh botol 330ml, 41g gula, 8g laktosa, 200mg natrium, 0g lemak
// → gula 10 g/100ml (Level C), natrium 60.6 mg/100ml (Level B), lemak 0 (Level A)
// → final Level C driven by gula
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

export default function Home() {
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

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Sample result — Phase 2 preview */}
        <section className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Contoh Produk
              </p>
              <h2 className="text-lg font-black mt-0.5">Teh Botol 330ml</h2>
              <p className="text-sm text-gray-500">Sosro</p>
            </div>
          </div>

          <NutriLevelBadge result={sampleResult} />
          <NutrientBreakdown result={sampleResult} />
        </section>
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
