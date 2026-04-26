# Changelog

All notable changes to SehatGak will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Fixed
- `NutriLevelBadge` worst-nutrient callout now shows correct unit per nutrient (`g` for gula/lemak jenuh, `mg` for natrium) instead of always appending `%`. Previously a high-sodium product like a 5143 mg/100g sauce displayed as "5143%", which was nonsensical.

---

## [0.9.0] — 2026-04-24

### Security
- **C2** — Gemini API key moved from URL query string to `x-goog-api-key` request header (`lib/ocr/gemini.ts`)
- **C3** — Upstream Gemini error bodies no longer forwarded to clients; generic Bahasa message returned, detail logged server-side
- **C4** — Magic-byte sniff on uploaded images rejects files whose bytes don't match declared MIME (prevents mislabeled content reaching Gemini)
- **C6** — Barcode lookup route validates format (`^\d{8,14}$`) and stops returning `nama` (reduces enumeration oracle exposure)
- **C7** — Origin/Referer check on all POST API routes; cross-origin requests rejected with 403
- **C8** — Security headers added via `next.config.ts`: CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`; inline theme script extracted to `public/theme.js`

### Fixed
- "Rincian per 100 ml" and "/ 100 ml" labels now correctly show "g" instead of "ml" for non-liquid categories (Snack, Makanan, Lainnya) in both `NutriLevelBadge` and `NutrientBreakdown` components
- iOS Safari barcode scanning — replaced `html5-qrcode` with `@zxing/browser`. iOS lacks the `BarcodeDetector` API and the prior library's fallback path had iOS-specific camera-stream bugs. Android and desktop behavior unchanged.

### Pending (user action required)
- **C1** — Cloudflare WAF rate-limit rules for `/api/ocr` (10 req/min/IP) and `/api/products` (30 req/min/IP) — see `_drafts/fix-guidelines.md`
- **C5** — Switch server Supabase client to `service_role` key + tighten RLS — requires `SUPABASE_SECRET_KEY` env var; see `_drafts/fix-guidelines.md`

---

## [0.8.0] — 2026-04-24

### Added
- **Barcode field** — product barcode stored as a consistent identifier across different user-supplied names
  - `barcode` column added to DB (`text NOT NULL DEFAULT 'N/A'`)
  - OCR prompt v2.4: Gemini reads the numeric digits below the barcode symbol (EAN-13, UPC-A, etc.) and pre-fills the field
  - Scan form: barcode input shown after Kategori; required before saving unless "Barcode tidak ada / tidak terbaca" is checked (stores 'N/A')
  - Product detail page: barcode shown inline with serving size when available

### Migration
- Run in Supabase SQL editor:
  ```sql
  ALTER TABLE products ADD COLUMN barcode text NOT NULL DEFAULT 'N/A';
  ```

---

## [0.7.0] — 2026-04-24

### Added
- **Category support** — products now have a type: Minuman (default), Snack, Makanan, Lainnya
  - `category` column added to DB (`text NOT NULL DEFAULT 'minuman'` with CHECK constraint)
  - `Category` type + `CATEGORY_LABEL` map added to `lib/supabase/types.ts`
  - `categorySchema` added to `lib/supabase/schema.ts`
  - OCR prompt v2.3: Gemini now detects product category from label context; `kategori` field added to `ocrResultSchema`
  - Scan form: category `<select>` shown after Merek (pre-filled from OCR, user-editable)
  - Scan form: non-beverage disclaimer banner appears when category ≠ Minuman
  - `ProductCard`: non-minuman category shown as a small chip below brand
  - Product detail page: category chip next to product name; non-beverage note shown when applicable

### Migration
- Run in Supabase SQL editor:
  ```sql
  ALTER TABLE products ADD COLUMN category text NOT NULL DEFAULT 'minuman'
    CHECK (category IN ('minuman', 'snack', 'makanan', 'lainnya'));
  ```

---

## [0.6.0] — 2026-04-24

### Added
- **Ingredient-list OCR** — products without a nutrition table are now processed:
  - OCR prompt v2: detects `has_nutrition_table`, falls back to scanning ingredient list, handles multilingual labels (Indonesian / English / Chinese / Japanese) and 20+ sweetener names by E-number and common aliases
  - `OcrResult.has_nutrition_table` field (Zod schema updated)
  - API returns 200 with `warnings` array instead of 422 when critical fields are missing — user can fill in values manually in the edit form
  - Scan page shows a dedicated banner when no nutrition table is detected
- **Light / Dark mode**
  - `@custom-variant dark` (class-based, no media-query conflict)
  - Full semantic CSS token system (`--bg`, `--surface`, `--surface-hi`, `--tx-1/2/3`, `--action`, warn/err tokens)
  - Warm cream light mode (`#EDEBE6` background) and deep slate dark mode (`#18181B`)
  - Anti-flash inline script in `<head>` reads `localStorage` before first paint
  - `components/ThemeToggle.tsx` — sun/moon SVG button, persists to localStorage, respects `prefers-color-scheme` on first visit
- `ThemeToggle` placed in all page headers (landing, scan, product detail)

### Changed
- All components and pages now use CSS variables for color — fully themed, no hardcoded gray-* classes
- `NutriLevelBadge`: level B/C now use dark foreground text for accessibility
- `NutrientBreakdown`: uses semantic `--surface-hi` / `--warn-*` / `--err-*` tokens
- `ProductCard`: rounded-2xl, subtle hover state using CSS vars, dark-safe foreground
- Sticky header with `backdrop-filter: blur` on all pages
- `ScanClient`: scan target area is now a `<button>` (keyboard accessible), SVG icons replace emoji
- `globals.css`: smooth 0.15s color transitions for theme switch, custom scrollbar

---

## [0.5.0] — 2026-04-24

### Added
- `app/loading.tsx` — skeleton UI for landing page while Supabase fetch resolves
- `app/error.tsx` — error boundary with "Coba Lagi" + "Ke Beranda" actions
- `app/not-found.tsx` — global 404 page
- `app/product/[id]/page.tsx` — product detail page: recalculates full breakdown from stored raw values, shows `NutriLevelBadge` + `NutrientBreakdown` + raw nutrition table
- Basic search on landing page via `?q=` URL param (Supabase ILIKE on `nama`)
- Distinct empty state for "no search results" vs "DB is empty"

### Changed
- `components/ProductCard.tsx` — card is now a link to `/product/[id]`, with hover transition
- `app/globals.css` — body background changed from pure white to `#f9fafb` (gray-50) for softer feel
- `app/page.tsx` — consumes `searchParams` (Next.js 15 async), passes query to Supabase, renders search bar

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
