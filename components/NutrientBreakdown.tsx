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
    <div className="w-full">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">
        Rincian Kandungan
      </h3>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg px-4 py-3 bg-gray-50"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800">{row.label}</span>
              <span className="text-sm text-gray-500">{row.value}</span>
            </div>
            <span
              className="text-sm font-black px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: LEVEL_COLORS[row.level] }}
            >
              {LEVEL_LABEL[row.level]}
            </span>
          </div>
        ))}
      </div>

      {result.notes.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 mb-1">
            Catatan
          </p>
          <ul className="list-disc list-inside space-y-1">
            {result.notes.map((note) => (
              <li key={note} className="text-sm text-yellow-800">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
