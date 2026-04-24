# Changelog

All notable changes to SehatGak will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [0.4.0] — 2026-04-24

### Added
- `lib/ocr/prompt.ts` — versioned Gemini extraction prompt
- `lib/ocr/schema.ts` — Zod schema for OCR output + missing field checker
- `lib/ocr/gemini.ts` — Gemini 2.5 Flash API caller with error handling (parse fail, rate limit, API error)
- `POST /api/ocr` — accepts image upload, compresses, calls Gemini, returns extracted nutrition fields
- `/scan` page — camera/file capture → OCR → editable form with live Nutri-Level preview → save to Supabase
- Client-side image compression to max 1600px before upload

---

## [0.3.0] — 2026-04-24

### Added
- `lib/supabase/` — browser + server clients, `ProductRow`/`ProductInsert` types, Zod schemas
- `GET /api/products` — returns latest 20 products, Zod-validated
- `POST /api/products` — validates body, inserts to Supabase, returns created row
- `ProductCard` component — compact card with level badge and worst-nutrient %
- Landing page fetches real products from Supabase; shows sample when empty (`force-dynamic`)

---

## [0.2.0] — 2026-04-23

### Added
- Official KMK 301/2026 Nutri-Level colors as CSS variables (`--nutri-a/b/c/d`)
- `NutriLevelBadge` component — all 4 letters, active one enlarged with official color
- `NutrientBreakdown` component — per-nutrient rows with level pills and notes
- Landing page with hero CTA, sample product (fictional Yakuza-inspired), footer

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
