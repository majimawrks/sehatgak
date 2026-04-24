export type Level = 'A' | 'B' | 'C' | 'D'

export type CalcInput = {
  gulaTotalGram: number
  laktosaGram?: number
  natriumMg: number
  lemakJenuhGram: number
  takaranSajiMl: number
  hasSweetenerAdditive: boolean
  hasOnlyNaturalSweetener: boolean
}

export type NutrientResult = {
  per100ml: number
  level: Level
}

export type GulaResult = NutrientResult & {
  displayPercent: number
}

export type CalcResultOk = {
  exempt: false
  level: Level
  worstNutrient: 'gula' | 'natrium' | 'lemakJenuh'
  worstDisplayPercent: number
  breakdown: {
    gula: GulaResult
    natrium: NutrientResult
    lemakJenuh: NutrientResult
  }
  notes: string[]
}

export type CalcResultExempt = {
  exempt: true
}

export type CalcResult = CalcResultOk | CalcResultExempt
