import type { Level } from '@/lib/supabase/types'

type Props = {
  id: string
  nama: string
  merek: string | null
  level: Level
  worstNutrient: string
  worstDisplayPercent: number | null
  createdAt: string
}

const LEVEL_COLORS: Record<Level, string> = {
  A: 'var(--nutri-a)',
  B: 'var(--nutri-b)',
  C: 'var(--nutri-c)',
  D: 'var(--nutri-d)',
}

const NUTRIENT_LABEL: Record<string, string> = {
  gula: 'gula',
  natrium: 'garam',
  lemakJenuh: 'lemak jenuh',
}

export function ProductCard({ nama, merek, level, worstNutrient, worstDisplayPercent }: Props) {
  const color = LEVEL_COLORS[level]
  const nutrientLabel = NUTRIENT_LABEL[worstNutrient] ?? worstNutrient

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-gray-900 truncate">{nama}</span>
        {merek && (
          <span className="text-xs text-gray-400 truncate">{merek}</span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        {worstDisplayPercent != null && (
          <span className="text-xs text-gray-400">
            {worstDisplayPercent}% {nutrientLabel}
          </span>
        )}
        <div
          className="flex items-center justify-center rounded-lg text-white font-black text-lg"
          style={{ backgroundColor: color, width: '2.5rem', height: '2.5rem' }}
          aria-label={`Nutri-Level ${level}`}
        >
          {level}
        </div>
      </div>
    </div>
  )
}
