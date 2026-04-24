import { describe, it, expect } from 'vitest'
import { calculateLevel } from './index'
import type { CalcInput } from './types'

// Base input — all values zero out GGL so tests override what they need
const base: CalcInput = {
  gulaTotalGram: 0,
  natriumMg: 0,
  lemakJenuhGram: 0,
  takaranSajiMl: 100,
  hasSweetenerAdditive: false,
  hasOnlyNaturalSweetener: false,
}

// ─── KMK Lampiran A worked examples (note 5) ────────────────────────────────

describe('normalization — KMK Lampiran A worked examples', () => {
  it('example 1: 19g gula, 4g laktosa, 250ml → 6 g/100ml', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 19,
      laktosaGram: 4,
      takaranSajiMl: 250,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.per100ml).toBeCloseTo(6, 5)
  })

  it('example 2: 41g gula, 8g laktosa, 330ml → 10 g/100ml', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 41,
      laktosaGram: 8,
      takaranSajiMl: 330,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.per100ml).toBeCloseTo(10, 5)
  })

  it('example 3: 20g gula, no laktosa, 500ml → 4 g/100ml', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 20,
      takaranSajiMl: 500,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.per100ml).toBeCloseTo(4, 5)
  })
})

// ─── Zero-GGL exemption ──────────────────────────────────────────────────────

describe('zero-GGL exemption', () => {
  it('returns exempt when all nutrients are zero', () => {
    const result = calculateLevel(base)
    expect(result.exempt).toBe(true)
  })

  it('does NOT exempt when only gula is zero but natrium is nonzero', () => {
    const result = calculateLevel({ ...base, natriumMg: 10 })
    expect(result.exempt).toBe(false)
  })
})

// ─── Sugar rounding table boundaries ────────────────────────────────────────

describe('sugar rounding table boundaries', () => {
  const gula = (gulaPer100ml: number) =>
    calculateLevel({ ...base, gulaTotalGram: gulaPer100ml, takaranSajiMl: 100 })

  it('0.4 g/100ml → display 0%, level A', () => {
    const r = gula(0.4)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(0)
    expect(r.breakdown.gula.level).toBe('A')
  })

  it('0.5 g/100ml → display 1%, level A', () => {
    const r = gula(0.5)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(1)
    expect(r.breakdown.gula.level).toBe('A')
  })

  it('1.0 g/100ml → display 1%, level A', () => {
    const r = gula(1.0)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(1)
    expect(r.breakdown.gula.level).toBe('A')
  })

  // Tricky: 1.1 displays as "1%" but is Level B
  it('1.1 g/100ml → display 1%, level B (tricky boundary)', () => {
    const r = gula(1.1)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(1)
    expect(r.breakdown.gula.level).toBe('B')
  })

  it('5.0 g/100ml → display 5%, level B', () => {
    const r = gula(5.0)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(5)
    expect(r.breakdown.gula.level).toBe('B')
  })

  // Tricky: 5.1 displays as "5%" but is Level C
  it('5.1 g/100ml → display 5%, level C (tricky boundary)', () => {
    const r = gula(5.1)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(5)
    expect(r.breakdown.gula.level).toBe('C')
  })

  it('10.0 g/100ml → display 10%, level C', () => {
    const r = gula(10.0)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(10)
    expect(r.breakdown.gula.level).toBe('C')
  })

  // Tricky: 10.1 displays as "10%" but is Level D
  it('10.1 g/100ml → display 10%, level D (tricky boundary)', () => {
    const r = gula(10.1)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(10)
    expect(r.breakdown.gula.level).toBe('D')
  })

  it('11.0 g/100ml → display 11%, level D', () => {
    const r = gula(11.0)
    expect(r.exempt).toBe(false)
    if (r.exempt) return
    expect(r.breakdown.gula.displayPercent).toBe(11)
    expect(r.breakdown.gula.level).toBe('D')
  })
})

// ─── Nutrient threshold boundaries ──────────────────────────────────────────

describe('gula threshold boundaries', () => {
  const gula = (g: number) =>
    calculateLevel({ ...base, gulaTotalGram: g, takaranSajiMl: 100 })

  it('≤1.0 → A', () => { const r = gula(1.0); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.gula.level).toBe('A') })
  it('>1.0 → B', () => { const r = gula(1.01); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.gula.level).toBe('B') })
  it('≤5.0 → B', () => { const r = gula(5.0); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.gula.level).toBe('B') })
  it('>5.0 → C', () => { const r = gula(5.01); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.gula.level).toBe('C') })
  it('≤10.0 → C', () => { const r = gula(10.0); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.gula.level).toBe('C') })
  it('>10.0 → D', () => { const r = gula(10.01); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.gula.level).toBe('D') })
})

describe('natrium threshold boundaries', () => {
  const nat = (mg: number) =>
    calculateLevel({ ...base, natriumMg: mg, takaranSajiMl: 100 })

  it('≤5 mg → A', () => { const r = nat(5); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.natrium.level).toBe('A') })
  it('>5 mg → B', () => { const r = nat(5.1); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.natrium.level).toBe('B') })
  it('≤120 mg → B', () => { const r = nat(120); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.natrium.level).toBe('B') })
  it('>120 mg → C', () => { const r = nat(120.1); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.natrium.level).toBe('C') })
  it('≤500 mg → C', () => { const r = nat(500); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.natrium.level).toBe('C') })
  it('>500 mg → D', () => { const r = nat(500.1); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.natrium.level).toBe('D') })
})

describe('lemak jenuh threshold boundaries', () => {
  const lemak = (g: number) =>
    calculateLevel({ ...base, lemakJenuhGram: g, takaranSajiMl: 100 })

  it('≤0.7 g → A', () => { const r = lemak(0.7); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.lemakJenuh.level).toBe('A') })
  it('>0.7 g → B', () => { const r = lemak(0.71); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.lemakJenuh.level).toBe('B') })
  it('≤1.2 g → B', () => { const r = lemak(1.2); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.lemakJenuh.level).toBe('B') })
  it('>1.2 g → C', () => { const r = lemak(1.21); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.lemakJenuh.level).toBe('C') })
  it('≤2.8 g → C', () => { const r = lemak(2.8); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.lemakJenuh.level).toBe('C') })
  it('>2.8 g → D', () => { const r = lemak(2.81); expect(r.exempt).toBe(false); if (!r.exempt) expect(r.breakdown.lemakJenuh.level).toBe('D') })
})

// ─── Sweetener additive downgrade ───────────────────────────────────────────

describe('sweetener additive downgrade', () => {
  it('level A + any sweetener additive → downgraded to B', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 0.5,
      takaranSajiMl: 100,
      hasSweetenerAdditive: true,
      hasOnlyNaturalSweetener: true, // natural, but still forces B
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.level).toBe('B')
    expect(result.notes.some((n) => n.includes('A ke B'))).toBe(true)
  })

  it('level B + artificial sweetener → downgraded to C', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 2,
      takaranSajiMl: 100,
      hasSweetenerAdditive: true,
      hasOnlyNaturalSweetener: false, // artificial
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.level).toBe('C')
    expect(result.notes.some((n) => n.includes('B ke C'))).toBe(true)
  })

  it('level B + only natural sweetener → stays B', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 2,
      takaranSajiMl: 100,
      hasSweetenerAdditive: true,
      hasOnlyNaturalSweetener: true,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.level).toBe('B')
  })

  it('level C + artificial sweetener → stays C (no further downgrade)', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 6,
      takaranSajiMl: 100,
      hasSweetenerAdditive: true,
      hasOnlyNaturalSweetener: false,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.breakdown.gula.level).toBe('C')
  })
})

// ─── Worst-nutrient selection ────────────────────────────────────────────────

describe('worst-nutrient selection', () => {
  it('natrium drives final level when highest', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 1,    // → A
      natriumMg: 200,      // → C
      lemakJenuhGram: 0.5, // → A
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('C')
    expect(result.worstNutrient).toBe('natrium')
  })

  it('lemak drives final level when highest', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 1,    // → A
      natriumMg: 5,        // → A
      lemakJenuhGram: 2,   // → C
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('C')
    expect(result.worstNutrient).toBe('lemakJenuh')
  })

  it('tie between gula and natrium → gula wins (tie-break order)', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 6,    // → C
      natriumMg: 200,      // → C
      lemakJenuhGram: 0.5, // → A
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('C')
    expect(result.worstNutrient).toBe('gula')
  })

  it('tie between natrium and lemak → natrium wins (tie-break order)', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 0,    // exempt would fire if all zero, so keep gula=0 but set others
      natriumMg: 200,      // → C
      lemakJenuhGram: 2,   // → C
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('C')
    expect(result.worstNutrient).toBe('natrium')
  })
})

// ─── Final level = worst of all three ───────────────────────────────────────

describe('final level', () => {
  it('all A → final A', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 0.5,
      natriumMg: 5,
      lemakJenuhGram: 0.7,
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('A')
  })

  it('gula=B, rest=A → final B', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 2,
      natriumMg: 5,
      lemakJenuhGram: 0.5,
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('B')
  })

  it('gula=A, natrium=D → final D', () => {
    const result = calculateLevel({
      ...base,
      gulaTotalGram: 1,
      natriumMg: 600,
      lemakJenuhGram: 0.5,
      takaranSajiMl: 100,
    })
    expect(result.exempt).toBe(false)
    if (result.exempt) return
    expect(result.level).toBe('D')
  })
})
