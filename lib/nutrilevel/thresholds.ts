import type { Level } from './types'

// KMK 301/2026 Lampiran A — thresholds per 100ml

export function gulaLevel(gulaPer100ml: number): Level {
  if (gulaPer100ml <= 1.0) return 'A'
  if (gulaPer100ml <= 5.0) return 'B'
  if (gulaPer100ml <= 10.0) return 'C'
  return 'D'
}

export function natriumLevel(natriumPer100ml: number): Level {
  if (natriumPer100ml <= 5) return 'A'
  if (natriumPer100ml <= 120) return 'B'
  if (natriumPer100ml <= 500) return 'C'
  return 'D'
}

export function lemakJenuhLevel(lemakPer100ml: number): Level {
  if (lemakPer100ml <= 0.7) return 'A'
  if (lemakPer100ml <= 1.2) return 'B'
  if (lemakPer100ml <= 2.8) return 'C'
  return 'D'
}

const LEVEL_ORDER: Record<Level, number> = { A: 0, B: 1, C: 2, D: 3 }

export function maxLevel(...levels: Level[]): Level {
  return levels.reduce((worst, current) =>
    LEVEL_ORDER[current] > LEVEL_ORDER[worst] ? current : worst
  )
}

export function levelOrder(level: Level): number {
  return LEVEL_ORDER[level]
}
