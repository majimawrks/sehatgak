import type { Level } from './types'
import { gulaLevel } from './thresholds'

// KMK 301/2026 Lampiran A note 9 — sugar rounding table.
// IMPORTANT: Level is driven by raw g/100ml value, NOT by the rounded display %.
// The display % is only for label presentation. A value of 1.1 g/100ml displays as "1%"
// but is Level B (not A), because the raw value exceeds 1.0.

type RoundingRow = {
  min: number   // inclusive lower bound
  max: number   // inclusive upper bound
  display: number  // integer percentage shown on label
  level: Level
}

const SUGAR_ROUNDING_TABLE: RoundingRow[] = [
  { min: 0.0,  max: 0.4,  display: 0,  level: 'A' },
  { min: 0.5,  max: 1.0,  display: 1,  level: 'A' },
  { min: 1.1,  max: 1.4,  display: 1,  level: 'B' },
  { min: 1.5,  max: 2.4,  display: 2,  level: 'B' },
  { min: 2.5,  max: 3.4,  display: 3,  level: 'B' },
  { min: 3.5,  max: 4.4,  display: 4,  level: 'B' },
  { min: 4.5,  max: 5.0,  display: 5,  level: 'B' },
  { min: 5.1,  max: 5.4,  display: 5,  level: 'C' },
  { min: 5.5,  max: 6.4,  display: 6,  level: 'C' },
  { min: 6.5,  max: 7.4,  display: 7,  level: 'C' },
  { min: 7.5,  max: 8.4,  display: 8,  level: 'C' },
  { min: 8.5,  max: 9.4,  display: 9,  level: 'C' },
  { min: 9.5,  max: 10.0, display: 10, level: 'C' },
  { min: 10.1, max: 10.4, display: 10, level: 'D' },
]

export type SugarRoundingResult = {
  displayPercent: number
  level: Level
}

/**
 * Look up the sugar rounding table for g/100ml values up to 10.4.
 * For values above 10.4, the level is always D and display rounds normally (1 decimal → integer).
 */
export function sugarRounding(gulaPer100ml: number): SugarRoundingResult {
  // Find matching row in the explicit table
  const row = SUGAR_ROUNDING_TABLE.find(
    (r) => gulaPer100ml >= r.min && gulaPer100ml <= r.max
  )

  if (row) {
    return { displayPercent: row.display, level: row.level }
  }

  // Gaps in the explicit table (e.g. 1.01–1.09, 5.01–5.09) occur because the KMK table
  // uses one-decimal-place label values as row boundaries. Fall back to threshold-based
  // level with standard integer rounding for display.
  if (gulaPer100ml <= 10.4) {
    return {
      displayPercent: Math.round(gulaPer100ml),
      level: gulaLevel(gulaPer100ml),
    }
  }

  // Above 10.4: always Level D, display rounds to nearest integer
  return {
    displayPercent: Math.round(gulaPer100ml),
    level: 'D',
  }
}
