import type { CalcResultOk, Level } from '@/lib/nutrilevel/types'

type Props = {
  result: CalcResultOk
}

const LEVEL_COLORS: Record<Level, string> = {
  A: 'var(--nutri-a)',
  B: 'var(--nutri-b)',
  C: 'var(--nutri-c)',
  D: 'var(--nutri-d)',
}

const NUTRIENT_LABEL: Record<CalcResultOk['worstNutrient'], string> = {
  gula: 'gula',
  natrium: 'garam',
  lemakJenuh: 'lemak jenuh',
}

const LEVELS: Level[] = ['A', 'B', 'C', 'D']

export function NutriLevelBadge({ result }: Props) {
  const { level, worstNutrient, worstDisplayPercent } = result
  const activeColor = LEVEL_COLORS[level]

  return (
    <div className="flex items-center gap-4">
      {/* Badge — all four letters, active one enlarged */}
      <div className="flex items-end gap-1">
        {LEVELS.map((l) => {
          const isActive = l === level
          const color = LEVEL_COLORS[l]
          return (
            <div
              key={l}
              className={
                isActive
                  ? 'flex items-center justify-center rounded font-black'
                  : 'flex items-center justify-center rounded font-bold opacity-50'
              }
              // Active letter is larger per KMK badge spec
              style={{
                ...(isActive
                  ? { backgroundColor: color, color: '#fff' }
                  : { border: `2px solid ${color}`, color }),
                width: isActive ? '3.5rem' : '2rem',
                height: isActive ? '3.5rem' : '2rem',
                fontSize: isActive ? '1.75rem' : '1rem',
              }}
              aria-label={isActive ? `Nutri-Level ${l} (aktif)` : `Level ${l}`}
            >
              {l}
            </div>
          )
        })}
      </div>

      {/* Worst-nutrient callout */}
      <div className="flex flex-col">
        <span
          className="text-3xl font-black leading-none"
          style={{ color: activeColor }}
        >
          {worstDisplayPercent}%
        </span>
        <span className="text-sm text-gray-600 font-bold uppercase tracking-wide">
          {NUTRIENT_LABEL[worstNutrient]}
        </span>
      </div>
    </div>
  )
}
