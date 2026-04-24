# Changelog

All notable changes to SehatGak will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.1.0] — 2026-04-23

### Added
- Next.js 15 + TypeScript (strict) + Tailwind CSS v4 project scaffold
- Vitest setup for unit testing
- `lib/nutrilevel/types.ts` — TypeScript types for calc input/output
- `lib/nutrilevel/thresholds.ts` — KMK 301/2026 nutrient level thresholds (gula, natrium, lemak jenuh)
- `lib/nutrilevel/rounding.ts` — Sugar rounding table per KMK Lampiran A note 9
- `lib/nutrilevel/index.ts` — `calculateLevel()` function (normalization, sweetener downgrade, worst-nutrient selection, zero-GGL exemption)
- 43 unit tests covering all KMK worked examples, rounding boundaries, threshold boundaries, sweetener downgrade rules, and worst-nutrient tie-breaking
