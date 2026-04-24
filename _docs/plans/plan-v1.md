# SehatGak — v1 Implementation Plan

**Audience:** implementing agent (Claude Sonnet)
**Source of truth:** `_docs/regulation/2026kepmenkes301.pdf` (KMK HK.01.07/MENKES/301/2026)
**Extracted text:** `_docs/regulation/kmk301.txt`
**Brainstorm context:** `_docs/plans/brainstorm-20260421.md`

---

## 1. Scope

Web app that:
1. Accepts a photo of an Indonesian beverage's Nutrition Facts (Informasi Nilai Gizi) panel
2. Extracts gula, laktosa (opt), natrium, lemak jenuh, takaran saji, and sweetener ingredients via Gemini Vision
3. Computes Nutri-Level A/B/C/D per KMK 301/2026
4. Displays result with official colors and worst-nutrient callout
5. Saves product to shared DB so other users can look it up without re-scanning

### Out of scope for v1 (do NOT implement)
- Authentication / user accounts
- Product edit / moderation / deletion flows
- Non-beverage categories (KMK 301/2026 only covers `minuman`)
- Manual-input fallback UI (OCR-only for v1; user can discard bad scans)
- Export, sharing, offline mode, PWA install
- Admin panel

---

## 2. Tech Stack (LOCKED — do not substitute)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | `create-next-app@latest`, strict TS |
| Styling | Tailwind CSS v4 | Default Next.js setup |
| DB | Supabase (Postgres) | Free tier; anonymous public insert/read |
| OCR | Gemini 2.5 Flash via REST | Server-side API route only — key never reaches browser |
| Testing | Vitest | For calc module (pure logic) |
| Package manager | `bun` (user has it installed) | Fall back to `npm` if bun fails |
| Deployment | Netlify | `sehatgak.majima.dev` — see `_docs/domain-setup.md` |

### Env vars
```
GEMINI_API_KEY=...          # server-only, never NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 3. Architecture

```
app/
  page.tsx                  # landing: scan CTA + product list
  scan/page.tsx             # camera/upload → result
  product/[id]/page.tsx     # saved product detail
  api/
    ocr/route.ts            # POST image → Gemini → extracted fields
    products/route.ts       # GET list, POST create
    products/[id]/route.ts  # GET single
lib/
  nutrilevel/
    index.ts                # public: calculateLevel(input) → result
    thresholds.ts           # KMK 301/2026 cutoffs
    rounding.ts             # sugar rounding table
    types.ts
  ocr/
    gemini.ts               # calls Gemini Vision, parses JSON
    prompt.ts               # extraction prompt (versioned)
  supabase/
    client.ts               # browser client
    server.ts               # server client
components/
  NutriLevelBadge.tsx       # A/B/C/D badge with official CMYK-derived colors
  NutrientBreakdown.tsx     # per-nutrient rows with level
  ScanUploader.tsx          # file input + camera capture
  ProductCard.tsx
_docs/
  plans/                    # this file, brainstorm
  regulation/               # KMK 301/2026 PDF + extracted text
```

---

## 4. Nutri-Level Calculation (THE critical piece — must be exact)

### 4.1 Inputs
```ts
type CalcInput = {
  gulaTotalGram: number;       // total sugar from label
  laktosaGram?: number;        // lactose, optional (subtracted if present)
  natriumMg: number;           // sodium
  lemakJenuhGram: number;      // saturated fat
  takaranSajiMl: number;       // serving volume in ml
  hasSweetenerAdditive: boolean;  // any added sweetener (natural OR artificial)
  hasOnlyNaturalSweetener: boolean; // true if additives exist but all are natural
}
```

### 4.2 Normalization (per KMK Lampiran A, note 5 & 8)
Convert per-serving values to per-100ml:
```
gulaPer100 = (gulaTotalGram - (laktosaGram ?? 0)) × (100 / takaranSajiMl)
natriumPer100 = natriumMg × (100 / takaranSajiMl)
lemakJenuhPer100 = lemakJenuhGram × (100 / takaranSajiMl)
```

**Worked examples from Lampiran (use as tests):**
| gula per saji | laktosa | takaran | expected g/100ml |
|---|---|---|---|
| 19g / 250ml | 4g | 250ml | 6 |
| 41g / 330ml | 8g | 330ml | 10 |
| 20g / 500ml | — | 500ml | 4 |

### 4.3 Thresholds (per 100ml)

| Nutrient | A | B | C | D |
|---|---|---|---|---|
| Gula (g) | ≤1.0 | >1.0 – ≤5.0 | >5.0 – ≤10.0 | >10.0 |
| Lemak jenuh (g) | ≤0.7 | >0.7 – ≤1.2 | >1.2 – ≤2.8 | >2.8 |
| Natrium (mg) | ≤5 | >5 – ≤120 | >120 – ≤500 | >500 |

### 4.4 Sugar rounding table (KMK Lampiran, note 9)
Apply BEFORE level assignment. One decimal place rounding per the displayed-label convention.

| g/100ml | Display % | Level |
|---|---|---|
| 0.0 – 0.4 | 0% | A |
| 0.5 – 1.0 | 1% | A |
| 1.1 – 1.4 | 1% | B |
| 1.5 – 2.4 | 2% | B |
| 2.5 – 3.4 | 3% | B |
| 3.5 – 4.4 | 4% | B |
| 4.5 – 5.0 | 5% | B |
| 5.1 – 5.4 | 5% | C |
| 5.5 – 6.4 | 6% | C |
| 6.5 – 7.4 | 7% | C |
| 7.5 – 8.4 | 8% | C |
| 8.5 – 9.4 | 9% | C |
| 9.5 – 10.0 | 10% | C |
| 10.1 – 10.4 | 10% | D |
| 10.5+ | round normally | D |

**Note the tricky rows:** 1.1, 5.1, 10.1 — the displayed rounded % is the same as the tier below (1%, 5%, 10%) but the level jumps up. Rounding does NOT drive the level; raw g/100ml drives it, and the rounded value is only for display. Implement accordingly.

### 4.5 Sweetener additive rules (Lampiran A, notes 2–4)
- **Level A** is forbidden if `hasSweetenerAdditive === true` (downgrade to B)
- **Level B** is forbidden if `hasSweetenerAdditive === true && hasOnlyNaturalSweetener === false` (downgrade to C)
- **Level C / D:** no restriction

Apply these AFTER threshold-based grading, as a downgrade-only step on the **gula** level.

### 4.6 Final level
```
finalLevel = max(levelGula, levelLemak, levelNatrium)    // where A<B<C<D
```
The "worst" nutrient is the one whose individual level equals finalLevel (if tied, pick gula > natrium > lemak for display).

### 4.7 Zero-GGL exemption (Lampiran A, note 10)
If `gulaPer100 === 0 && natriumPer100 === 0 && lemakJenuhPer100 === 0` → return `{ exempt: true }`. UI shows "Tidak wajib Nutri-Level (tidak mengandung GGL)."

### 4.8 Output
```ts
type CalcResult = {
  level: 'A' | 'B' | 'C' | 'D';
  exempt?: false;
  worstNutrient: 'gula' | 'natrium' | 'lemakJenuh';
  worstDisplayPercent: number;  // integer % (e.g. 33 for "33% gula")
  breakdown: {
    gula: { per100ml: number; displayPercent: number; level: Level };
    natrium: { per100ml: number; level: Level };
    lemakJenuh: { per100ml: number; level: Level };
  };
  notes: string[];  // e.g. "Diturunkan dari A ke B karena mengandung pemanis tambahan"
} | { exempt: true }
```

---

## 5. Gemini OCR Integration

### 5.1 Endpoint
`POST /api/ocr` — multipart/form-data with `image` field (JPEG/PNG, ≤5MB).

### 5.2 Prompt (store in `lib/ocr/prompt.ts`, export as const)
```
You are a nutrition label parser for Indonesian beverage products.
Extract values from the "Informasi Nilai Gizi" (nutrition facts) panel in the image.

Return ONLY valid JSON matching this schema, no markdown, no commentary:
{
  "takaran_saji_ml": number | null,     // serving size in ml. Convert "1 saji (250 ml)" → 250
  "sajian_per_kemasan": number | null,  // usually 1 for single-serve; ignore if not present
  "gula_total_g": number | null,        // "Gula" or "Total Gula" per serving, in grams
  "laktosa_g": number | null,           // "Laktosa" if listed separately, else null
  "natrium_mg": number | null,          // "Natrium" per serving, in mg
  "lemak_jenuh_g": number | null,       // "Lemak Jenuh" per serving, in grams
  "nama_produk": string | null,         // product name if visible on label
  "merek": string | null,               // brand if visible
  "pemanis_tambahan": {
    "ada": boolean,                     // true if ANY sweetener additive is listed in ingredients
    "hanya_alami": boolean,             // true if all listed sweeteners are natural (stevia, madu, sukrosa murni adalah GULA bukan pemanis tambahan)
    "daftar": string[]                  // extracted sweetener names, e.g. ["aspartam","sukralosa"]
  },
  "confidence": "high" | "medium" | "low",
  "warnings": string[]                  // any ambiguity, e.g. "takaran saji tidak tertera"
}

Rules:
- Values are PER SERVING unless the label explicitly says "per 100 ml". Do not pre-normalize.
- If a field is absent or unreadable, use null. Never guess.
- Sweetener additives include: aspartam, sukralosa, sakarin, asesulfam-K, siklamat, neotam, advantam, stevia, sorbitol, maltitol, xilitol, eritritol. Regular gula/sukrosa/fruktosa/glukosa are NOT additives.
- Natural sweeteners: stevia, sorbitol, xilitol, eritritol, maltitol (i.e. polyols and plant-derived).
- Artificial sweeteners: aspartam, sukralosa, sakarin, asesulfam-K, siklamat, neotam, advantam.
```

### 5.3 Gemini call shape
- Model: `gemini-2.5-flash`
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`
- Body: `{ contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type, data: base64 }}] }], generationConfig: { responseMimeType: "application/json", temperature: 0 } }`
- Parse `candidates[0].content.parts[0].text` as JSON
- Validate with Zod schema before returning

### 5.4 Error handling
- Invalid JSON from model → return 422 with `{ error: "parse_failed", raw: string }`
- Gemini 429 → return 503 with retry-after
- Missing critical fields (gula, natrium, lemak_jenuh, takaran_saji) → return 422 with `warnings`

---

## 6. Supabase Schema

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  merek text,
  varian text,
  ukuran_ml int,
  -- raw extracted values (per serving)
  gula_total_g numeric,
  laktosa_g numeric,
  natrium_mg numeric,
  lemak_jenuh_g numeric,
  takaran_saji_ml int not null,
  has_sweetener_additive boolean,
  has_only_natural_sweetener boolean,
  -- computed
  level char(1) not null check (level in ('A','B','C','D')),
  worst_nutrient text not null,
  worst_display_percent int,
  -- meta
  image_url text,           -- optional, Supabase Storage
  created_at timestamptz default now()
);

create index products_nama_idx on products using gin (to_tsvector('simple', nama));
```

### RLS (permissive for v1)
```sql
alter table products enable row level security;
create policy "public read" on products for select using (true);
create policy "public insert" on products for insert with check (true);
```
(Tighten later when auth is added.)

---

## 7. UI Requirements

### 7.1 Colors (CMYK from Lampiran, converted to sRGB hex approximations — verify in-app)
- Level A dark green: `#00833E` (CMYK 100/25/100/0)
- Level B light green: `#87C440` (CMYK 55/0/100/0)
- Level C yellow: `#FABE2D` (CMYK 0/30/90/0)
- Level D red: `#C8161D` (CMYK 20/100/100/10)

### 7.2 Badge component
All four letters A B C D displayed; active letter enlarged + filled with its color; inactive letters muted/outlined. Next to the badge, render `{worstDisplayPercent}% {worstNutrient}` in Arial Bold (use a close websafe fallback).

### 7.3 Minimal pages
- **`/`** — hero with "Scan produk" button, recent products grid (fetch from Supabase)
- **`/scan`** — file input + camera capture (`<input type="file" accept="image/*" capture="environment">`), submits to `/api/ocr`, shows spinner, then result preview with editable fields (so user can fix obvious OCR errors before saving) and "Simpan" button
- **`/product/[id]`** — full badge, breakdown, raw values, when scanned

All copy in Bahasa Indonesia.

---

## 8. Phase-by-phase Execution

### Phase 1 — Calc core (NO API, NO UI)
- Scaffold Next.js project (TS strict, Tailwind, Vitest)
- Implement `lib/nutrilevel/` modules
- Write tests covering:
  - Three Lampiran worked examples (→ 6, 10, 4 g/100ml)
  - Each rounding-table boundary: 0.4/0.5, 1.0/1.1, 5.0/5.1, 10.0/10.1
  - Each nutrient threshold boundary for all three nutrients
  - Sweetener downgrade: A+additive → B; B+artificial → C
  - Worst-nutrient selection when multiple nutrients tie
  - Zero-GGL exemption
- **Gate:** all tests green before Phase 2

### Phase 2 — UI shell + mock data
- Badge + breakdown components, styled
- Landing + result page with hardcoded sample `CalcResult`
- Verify colors match regulation spec visually

### Phase 3 — Supabase integration
- Create project, run schema SQL
- Wire `/api/products` GET+POST
- Landing fetches real list; save-from-result works end-to-end

### Phase 4 — Gemini OCR
- `/api/ocr` route with prompt + Zod validation
- `/scan` page wires: file pick → POST → show editable form → Save
- Handle errors (parse fail, missing fields, rate limit) with user-friendly messages in ID

### Phase 5 — Polish
- Loading skeletons, empty states, error boundaries
- Basic search on landing (ILIKE on `nama` is fine for v1)

---

## 9. Coding Guidelines (for implementing agent)

1. **TypeScript strict mode, no `any`.** Use Zod at all trust boundaries (API inputs, Gemini output, Supabase rows).
2. **Calc module is pure functions only.** No side effects, no I/O. It must remain unit-testable in isolation.
3. **Do not abstract prematurely.** Three similar lines beats a generic helper. No "future-proofing."
4. **No comments explaining WHAT the code does.** Only add a comment if the WHY is non-obvious (e.g. regulatory quirk). Reference the KMK section when you do: `// KMK 301/2026 Lampiran A note 9 — level is driven by raw g/100ml, not the rounded display value`.
5. **Bahasa Indonesia for all user-facing text.** English for code identifiers, comments, and logs.
6. **Never log or expose the Gemini API key.** Server routes only.
7. **Do NOT commit `.env.local`.** Add to `.gitignore` if not already there.
8. **Fail loudly on missing nutrition fields.** Better to reject a scan than save a wrong grade.
9. **No auth stubs, no "TODO: add auth later" scaffolding.** When auth is needed, it'll be a separate plan.
10. **Tests for the calc module are mandatory and must run in CI-ish fashion** (even if just `bun test` locally). UI and API route tests are NOT required for v1.

### Documentation & versioning
11. **Maintain `CHANGELOG.md`** at repo root. Start at version `0.0.0`. Every meaningful change (feature, fix, breaking change) gets an entry under a new version heading following [Keep a Changelog](https://keepachangelog.com/) format. Bump semver appropriately (0.0.x for fixes, 0.x.0 for features, x.0.0 for breaking). Also mirror the current version in `package.json`.
12. **Create supporting docs under `_docs/` whenever they'd help** — e.g. `_docs/schema.md` for DB changes, `_docs/ocr-prompt-history.md` if the Gemini prompt evolves, `_docs/deployment.md` for deploy steps. Keep them short and task-focused; don't write docs for the sake of docs.

### Forbidden in v1
- Any OCR fallback beyond Gemini (no Tesseract, no Claude, no BYOK)
- Any auth library (NextAuth, Clerk, Supabase Auth)
- State management libraries (Redux, Zustand, Jotai) — React state + server components are enough
- Form libraries (react-hook-form, Formik) — native `<form>` + server actions
- Component libraries (shadcn, Radix, MUI) — plain Tailwind. Only add if a specific primitive is hard to build (e.g. dialog) and justify in a comment.
- Analytics, error tracking (Sentry), feature flags
- i18n library — app is Indonesian-only

---

## 10. Verification Checklist (before declaring v1 done)

- [ ] All Phase 1 unit tests pass
- [ ] Scan a real Indonesian beverage label end-to-end; resulting level matches manual calculation
- [ ] Level colors visually match KMK 301/2026 spec when viewed on screen
- [ ] Zero-GGL product (e.g. plain mineral water) returns exemption message
- [ ] Saved products appear on landing after refresh
- [ ] API key not present anywhere in client bundle (`bun run build` + grep)
- [ ] `.env.local` not tracked by git
- [ ] README.md has setup instructions (env vars, Supabase SQL, `bun dev`)

---

## 11. Known Unknowns / Judgement Calls for Implementing Agent

- **Camera capture on desktop:** `capture="environment"` is mobile-only; on desktop just a file picker. Don't build a webcam component.
- **Image size limits:** compress client-side to max 1600px long edge before upload (use `<canvas>`). Keeps Gemini costs and latency down.
- **Editable OCR result:** show each extracted field as an input pre-filled with the extracted value. Required fields marked. User can correct before saving.
- **Decimal separator:** Indonesian labels use comma (`5,01`). Handle both `,` and `.` when parsing OCR output (Gemini should return numbers, but be defensive).
- **CMYK→sRGB approximations:** the hex values in §7.1 are starting points. If they look off, use [cmyk-to-rgb with relative colorimetric intent]; document final values in `tailwind.config.ts` as custom colors.
