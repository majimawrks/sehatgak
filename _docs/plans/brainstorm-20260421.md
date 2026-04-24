# SehatGak — Project Brainstorm Summary

## Identity
- **Name:** SehatGak
- **Repo:** `majimawrks/sehatgak` on GitHub
- **Rationale:** "Sehat gak?" — casual Indonesian for "is it healthy?" Unique, no trademark conflicts found.

---

## Concept
A web-based app that lets users:
1. Take/upload a photo of a product's nutrition fact table
2. Have the app extract GGL values (gula, garam, lemak) and calculate its Nutri-Level (A/B/C/D) per KMK HK.01.07/MENKES/301/2026
3. Save the product to a local database (for products that haven't labeled themselves yet)

**Why it exists:** KMK 301/2026 mandates Nutri-Level labeling for large-scale ready-to-serve beverage businesses, but enforcement is not yet active (mandatory 2 years after GGL maximum thresholds are set, which haven't been set yet). Many manufacturers haven't complied. SehatGak fills the gap by letting users self-check and crowdsource product data.

---

## Regulatory Reference
**KMK HK.01.07/MENKES/301/2026** — Pencantuman Label Gizi dan Pesan Kesehatan pada Pangan Olahan Siap Saji  
Signed: 14 April 2026 by Menkes Budi G. Sadikin

### Nutri-Level Grading Table (per 100 ml)

| Nutrient | A | B | C | D |
|---|---|---|---|---|
| Gula (g) | ≤1 | >1–5 | >5–10 | >10 |
| Garam/Natrium (mg) | ≤5 | >5–120 | >120–500 | >500 |
| Lemak jenuh (g) | ≤0.7 | >0.7–1.2 | >1.2–2.8 | >2.8 |

**Final level = worst-scoring nutrient** (e.g. if gula=B but garam=C → product is Level C)

**Level colors (official):**
- A = Dark green (`CMYK 100C 25M 100Y 0K`)
- B = Light green (`CMYK 55C 0M 100Y 0K`)
- C = Yellow (`CMYK 0C 30M 90Y 0K`)
- D = Red (`CMYK 20C 100M 100Y 10K`)

### Key Calculation Rules
1. **Sugar** = total sugar minus lactose (if lactose is listed on label), normalized to per 100ml from per-serving values
   - Formula: `(total_gula - laktosa) × (100 / volume_per_saji)`
2. **Garam** = derived from natrium (sodium) content
3. **Lemak** = derived from lemak jenuh (saturated fat)
4. **Level A extra rule:** cannot use any sweetener additives (natural or artificial), including carry-over
5. **Level B extra rule:** can only use natural sweetener additives
6. **Level C/D:** can use any sweetener additives
7. Products naturally containing zero GGL do not need to display Nutri-Level
8. Values are rounded (gula: 1 decimal place) before level assignment — see rounding table in KMK Lampiran

### Sugar Rounding Table (excerpt)
| Kandungan Gula (g/100ml) | Displayed Value | Level |
|---|---|---|
| 0.0–0.4 | 0% | A |
| 0.5–1.0 | 1% | A |
| 1.1–1.4 | 1% | B |
| 1.5–2.4 | 2% | B |
| ... | ... | ... |
| 5.1–5.4 | 5% | C |
| 10.1–10.4 | 10% | D |

### Label Display Logic
- All four letters A B C D are always shown
- The **active level letter is enlarged/highlighted**
- The percentage of the **worst-scoring nutrient** is shown alongside (e.g. "33% gula")

---

## Core Features
1. **Scan / Upload** — photo of nutrition facts table → OCR → extract gula, garam (natrium), lemak jenuh, serving size, volume
2. **Calculate** — normalize to per 100ml → apply rounding → determine level per nutrient → return worst = final grade
3. **Display** — show Nutri-Level badge (A/B/C/D with correct colors), breakdown per nutrient
4. **Save to DB** — product name, brand, variant/size, category, calculated level, raw values, date added
5. **Product list** — browse/search saved products

## Nice-to-Have (later)
- Manual input fallback (if OCR fails)
- Edit/correct saved product entries
- Export data

---

## Open Questions (to resolve during development)
- OCR approach: client-side (Tesseract.js) vs. server-side vs. Claude Vision API
- DB: local (IndexedDB/SQLite) vs. server-backed
- Whether to extend beyond beverages (the KMK only covers minuman, but packaged goods are the main use case)
- Sweetener additive detection (Level A/B distinction) — nutrition labels don't always list this clearly; may need to rely on ingredients list OCR or manual user input