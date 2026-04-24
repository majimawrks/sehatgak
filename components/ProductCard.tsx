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

// Level B (light green) and C (yellow) need dark text for readability
const NEEDS_DARK_TEXT = new Set<Level>(['B', 'C'])

const NUTRIENT_LABEL: Record<string, string> = {
  gula:       'gula',
  natrium:    'garam',
  lemakJenuh: 'lemak jenuh',
}

export function ProductCard({ id, nama, merek, level, worstNutrient, worstDisplayPercent }: Props) {
  const color = LEVEL_COLORS[level]
  const nutrientLabel = NUTRIENT_LABEL[worstNutrient] ?? worstNutrient
  const fg = NEEDS_DARK_TEXT.has(level) ? '#1B1916' : '#FFFFFF'

  return (
    <a
      href={`/product/${id}`}
      className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-lo)'
        ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-hi)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLElement).style.background = 'var(--surface)'
      }}
    >
      <div className="flex flex-col min-w-0 gap-0.5">
        <span
          className="font-bold text-sm truncate leading-snug"
          style={{ color: 'var(--tx-1)' }}
        >
          {nama}
        </span>
        {merek && (
          <span
            className="text-xs truncate"
            style={{ color: 'var(--tx-3)' }}
          >
            {merek}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 ml-4 shrink-0">
        {worstDisplayPercent != null && (
          <span
            className="text-xs tabular-nums"
            style={{ color: 'var(--tx-3)' }}
          >
            {worstDisplayPercent}%&nbsp;{nutrientLabel}
          </span>
        )}
        <div
          className="flex items-center justify-center rounded-lg font-black text-lg"
          style={{
            backgroundColor: color,
            color: fg,
            width: '2.5rem',
            height: '2.5rem',
          }}
          aria-label={`Nutri-Level ${level}`}
        >
          {level}
        </div>
      </div>
    </a>
  )
}
