import type { CalcResultOk, Level } from '@/lib/nutrilevel/types'

type Props = {
  result: CalcResultOk
  unit: 'ml' | 'g'
}

// Official KMK 301/2026 Lampiran B colors
const LEVEL_COLORS: Record<Level, string> = {
  A: 'var(--nutri-a)',
  B: 'var(--nutri-b)',
  C: 'var(--nutri-c)',
  D: 'var(--nutri-d)',
}

// Level B (#87C440 light green) and C (#FABE2D yellow) need dark foreground text
const NEEDS_DARK_TEXT = new Set<Level>(['B', 'C'])

const NUTRIENT_LABEL: Record<CalcResultOk['worstNutrient'], string> = {
  gula:       'gula',
  natrium:    'garam',
  lemakJenuh: 'lemak jenuh',
}

const NUTRIENT_UNIT: Record<CalcResultOk['worstNutrient'], string> = {
  gula:       'g',
  natrium:    'mg',
  lemakJenuh: 'g',
}

const LEVELS: Level[] = ['A', 'B', 'C', 'D']

export function NutriLevelBadge({ result, unit }: Props) {
  const { level, worstNutrient, worstDisplayPercent } = result
  const worstUnit = NUTRIENT_UNIT[worstNutrient]
  const activeColor = LEVEL_COLORS[level]

  return (
    <div className="flex items-center gap-5">
      {/* Four-letter badge per KMK spec — active letter enlarged */}
      <div className="flex items-end gap-1.5">
        {LEVELS.map((l) => {
          const isActive = l === level
          const color = LEVEL_COLORS[l]
          const fg = NEEDS_DARK_TEXT.has(l) ? '#1B1916' : '#FFFFFF'
          return (
            <div
              key={l}
              className="flex items-center justify-center rounded font-black select-none"
              style={
                isActive
                  ? {
                      backgroundColor: color,
                      color: fg,
                      width: '3.75rem',
                      height: '3.75rem',
                      fontSize: '1.875rem',
                    }
                  : {
                      border: `2px solid ${color}`,
                      color,
                      opacity: 0.4,
                      width: '2.25rem',
                      height: '2.25rem',
                      fontSize: '1.125rem',
                    }
              }
              aria-label={isActive ? `Nutri-Level ${l} (aktif)` : `Level ${l}`}
            >
              {l}
            </div>
          )
        })}
      </div>

      {/* Worst-nutrient callout */}
      <div className="flex flex-col gap-0.5">
        <span
          className="text-3xl font-black leading-none tracking-tight"
          style={{ color: activeColor }}
        >
          {worstDisplayPercent} {worstUnit}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--tx-2)]">
          {NUTRIENT_LABEL[worstNutrient]}
        </span>
        <span className="text-[11px] text-[var(--tx-3)]">per 100 {unit}</span>
      </div>
    </div>
  )
}
