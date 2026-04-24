import type { CalcInput, CalcResult, Level } from './types'
import { gulaLevel, natriumLevel, lemakJenuhLevel, maxLevel, levelOrder } from './thresholds'
import { sugarRounding } from './rounding'

export function calculateLevel(input: CalcInput): CalcResult {
  const {
    gulaTotalGram,
    laktosaGram,
    natriumMg,
    lemakJenuhGram,
    takaranSajiMl,
    hasSweetenerAdditive,
    hasOnlyNaturalSweetener,
  } = input

  // KMK 301/2026 Lampiran A note 5 — normalize per-serving values to per-100ml.
  // Sugar excludes lactose if listed.
  const gulaPer100 = (gulaTotalGram - (laktosaGram ?? 0)) * (100 / takaranSajiMl)
  const natriumPer100 = natriumMg * (100 / takaranSajiMl)
  const lemakPer100 = lemakJenuhGram * (100 / takaranSajiMl)

  // KMK 301/2026 Lampiran A note 10 — exempt if naturally zero GGL.
  if (gulaPer100 === 0 && natriumPer100 === 0 && lemakPer100 === 0) {
    return { exempt: true }
  }

  // KMK 301/2026 Lampiran A note 9 — sugar rounding table for display and level.
  const { displayPercent: gulaDisplayPercent, level: gulaLevelFromTable } = sugarRounding(gulaPer100)

  // KMK 301/2026 Lampiran A notes 2–4 — sweetener additive downgrade on gula level only.
  // Applied after threshold grading, downgrade-only.
  let gulaFinalLevel: Level = gulaLevelFromTable
  const notes: string[] = []

  if (gulaFinalLevel === 'A' && hasSweetenerAdditive) {
    gulaFinalLevel = 'B'
    notes.push('Diturunkan dari A ke B karena mengandung bahan tambahan pangan pemanis')
  }

  if (gulaFinalLevel === 'B' && hasSweetenerAdditive && !hasOnlyNaturalSweetener) {
    gulaFinalLevel = 'C'
    notes.push('Diturunkan dari B ke C karena mengandung pemanis buatan')
  }

  const natriumFinalLevel = natriumLevel(natriumPer100)
  const lemakFinalLevel = lemakJenuhLevel(lemakPer100)

  const finalLevel = maxLevel(gulaFinalLevel, natriumFinalLevel, lemakFinalLevel)

  // Worst nutrient: the one whose level equals finalLevel.
  // Tie-break order: gula > natrium > lemak (per plan).
  type Nutrient = 'gula' | 'natrium' | 'lemakJenuh'
  const candidates: Array<{ nutrient: Nutrient; lvl: Level }> = [
    { nutrient: 'gula',      lvl: gulaFinalLevel },
    { nutrient: 'natrium',   lvl: natriumFinalLevel },
    { nutrient: 'lemakJenuh', lvl: lemakFinalLevel },
  ]

  const worst = candidates.find((c) => c.lvl === finalLevel)!

  // Worst display percent: for gula use the rounding table value; others use per-100ml integer.
  const worstDisplayPercent =
    worst.nutrient === 'gula'
      ? gulaDisplayPercent
      : Math.round(worst.nutrient === 'natrium' ? natriumPer100 : lemakPer100)

  return {
    exempt: false,
    level: finalLevel,
    worstNutrient: worst.nutrient,
    worstDisplayPercent,
    breakdown: {
      gula: {
        per100ml: gulaPer100,
        displayPercent: gulaDisplayPercent,
        level: gulaFinalLevel,
      },
      natrium: {
        per100ml: natriumPer100,
        level: natriumFinalLevel,
      },
      lemakJenuh: {
        per100ml: lemakPer100,
        level: lemakFinalLevel,
      },
    },
    notes,
  }
}

export type { CalcInput, CalcResult, CalcResultOk, CalcResultExempt, Level } from './types'
