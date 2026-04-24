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

const LEVEL_LABEL: Record<Level, string> = {
  A: 'Level A',
  B: 'Level B',
  C: 'Level C',
  D: 'Level D',
}

const NEEDS_DARK_TEXT = new Set<Level>(['B', 'C'])

type Row = {
  label: string
  value: string
  level: Level
}

export function NutrientBreakdown({ result }: Props) {
  const { breakdown } = result

  const rows: Row[] = [
    {
      label: 'Gula',
      value: `${breakdown.gula.per100ml.toFixed(1)} g / 100 ml`,
      level: breakdown.gula.level,
    },
    {
      label: 'Garam (Natrium)',
      value: `${breakdown.natrium.per100ml.toFixed(0)} mg / 100 ml`,
      level: breakdown.natrium.level,
    },
    {
      label: 'Lemak Jenuh',
      value: `${breakdown.lemakJenuh.per100ml.toFixed(1)} g / 100 ml`,
      level: breakdown.lemakJenuh.level,
    },
  ]

  return (
    <div className="w-full flex flex-col gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--tx-3)]">
        Rincian per 100 ml
      </p>

      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--border-lo)',
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-[var(--tx-1)]">{row.label}</span>
              <span className="text-xs text-[var(--tx-3)]">{row.value}</span>
            </div>
            <span
              className="text-xs font-black px-3 py-1 rounded-full shrink-0"
              style={{
                backgroundColor: LEVEL_COLORS[row.level],
                color: NEEDS_DARK_TEXT.has(row.level) ? '#1B1916' : '#FFFFFF',
              }}
            >
              {LEVEL_LABEL[row.level]}
            </span>
          </div>
        ))}
      </div>

      {result.notes.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 mt-1"
          style={{
            background: 'var(--warn-bg)',
            border: '1px solid var(--warn-border)',
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: 'var(--warn-tx)' }}
          >
            Catatan
          </p>
          <ul className="list-disc list-inside space-y-1">
            {result.notes.map((note) => (
              <li key={note} className="text-xs" style={{ color: 'var(--warn-tx)' }}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
