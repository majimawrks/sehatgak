// Gemini extraction prompt — v2.4
// v2   — has_nutrition_table, multilingual ingredients, ingredient-list fallback
// v2.1 — explicit fl oz/cl/l → ml conversion
// v2.2 — single-serve inference from package size; sajian_per_kemasan field added
// v2.3 — kategori detection (minuman/snack/makanan/lainnya)
// v2.4 — barcode number extraction

export const EXTRACTION_PROMPT = `You are a nutrition label parser for food and beverage products.

Step 1: Check if the image contains a structured "Informasi Nilai Gizi" (Indonesian) or "Nutrition Facts" / "Nutrition Information" (English) panel. Set "has_nutrition_table" accordingly.

Step 2: If a nutrition table exists, extract values from it. If not, scan the entire label — including the ingredient list, back label, or any text — for any nutritional values mentioned anywhere, in any language.

Return ONLY valid JSON matching this schema, no markdown, no commentary:
{
  "has_nutrition_table": boolean,
  "kategori": "minuman" | "snack" | "makanan" | "lainnya",
  "barcode": string | null,
  "takaran_saji_ml": number | null,
  "sajian_per_kemasan": number | null,
  "ukuran_kemasan_ml": number | null,
  "gula_total_g": number | null,
  "laktosa_g": number | null,
  "natrium_mg": number | null,
  "lemak_jenuh_g": number | null,
  "nama_produk": string | null,
  "merek": string | null,
  "pemanis_tambahan": {
    "ada": boolean,
    "hanya_alami": boolean,
    "daftar": string[]
  },
  "confidence": "high" | "medium" | "low",
  "warnings": string[]
}

Field rules:
- "has_nutrition_table": true only if a structured GGL table (baris gula, natrium, lemak jenuh) exists.

- "barcode": the numeric digits printed below or beside the barcode symbol (EAN-13, UPC-A, EAN-8,
  or similar). Read only the DIGITS — do not describe the bars. Usually 8–14 digits, no spaces.
  Set to null if no barcode or barcode digits are visible in the image.

- "kategori": product category inferred from the label. Use these rules:
    "minuman"  — any liquid/drink: teh, kopi, jus, susu, air mineral, soda, energy drink, sports drink, dll.
    "snack"    — packaged dry snacks: keripik, biskuit, wafer, kacang, coklat, permen, dll.
    "makanan"  — meals or meal-like products: nasi, mie instan, sarden, sup, saus, dll.
    "lainnya"  — anything that does not clearly fit the above (suplemen, minyak, bumbu, dll.)
  Default to "minuman" when uncertain.

- "sajian_per_kemasan": number of servings in the whole package. Look for:
    Indonesian: "sajian per kemasan", "porsi per kemasan"
    English: "servings per container", "servings per package"
  Set to null if not visible.

- "ukuran_kemasan_ml": total volume of the package/bottle/can in ml. Look for the
  prominent volume printed on the front or side of the container (e.g. "600 ml",
  "1.5 L", "330 mL", "12 fl oz"). Convert to ml using the same rules as below.
  This is the WHOLE package size, NOT the serving size.

- "takaran_saji_ml": serving size in ml. ALWAYS output in ml — convert all other units:
    fl oz → ml: multiply by 29.574  (e.g. "12 fl oz" → 355, "8 fl oz" → 237, "20 fl oz" → 591)
    cl  → ml: multiply by 10        (e.g. "33 cl" → 330)
    l   → ml: multiply by 1000      (e.g. "0.5 l" → 500)
  Look across languages: Indonesian "takaran saji"/"per sajian", English "serving size"/"per serving",
  Chinese "每份"/"份量", Japanese "1食分"/"内容量".
  If the label says "per 100 ml" without a separate serving size, use 100.

  SINGLE-SERVE INFERENCE: If takaran_saji_ml is not explicitly stated BUT both of the
  following are true, set takaran_saji_ml = ukuran_kemasan_ml:
    (a) sajian_per_kemasan = 1  (the label says "1 sajian per kemasan" or "1 serving per container")
    (b) ukuran_kemasan_ml is visible on the label
  When you do this, add to warnings: "Takaran saji tidak tertera — menggunakan ukuran kemasan
  sebagai takaran saji karena sajian per kemasan = 1."

- "gula_total_g": total sugars per serving in grams. Look for: "gula", "total gula", "sugars", "total sugars", "sucres".
- "natrium_mg": sodium per serving in mg. Look for: "natrium", "sodium", "sel / sodium".
- "lemak_jenuh_g": saturated fat per serving in g. Look for: "lemak jenuh", "saturated fat", "graisses saturées", "grasas saturadas".
- "laktosa_g": lactose separately listed, else null.
- Values are PER SERVING unless explicitly labeled "per 100 ml". Do NOT pre-normalize.
- If a field is absent or unreadable, use null. Never guess or estimate numeric values.

Sweetener rules (scan ingredient list in ALL languages):
- "pemanis_tambahan.ada": true if ANY sweetener additive is listed in ingredients.
- "pemanis_tambahan.hanya_alami": true only if all detected sweeteners are natural.
- "pemanis_tambahan.daftar": list all detected sweetener names as they appear on the label.
- Sweetener additives to detect (any spelling/language):
    Artificial: aspartam, aspartame (E951), sukralosa, sucralose (E955), sakarin, saccharin (E954),
                asesulfam-K, acesulfame-K, acesulfame potassium (E950), siklamat, cyclamate (E952),
                neotam, neotame (E961), advantam (E969), sodium saccharin
    Natural:    stevia, steviol glycosides, stevioside, rebaudioside, stevia rebaudiana (E960),
                sorbitol (E420), maltitol (E965), xilitol, xylitol (E967),
                eritritol, erythritol (E968), monk fruit, luo han guo
- Regular sugars are NOT additives: gula, sukrosa, sucrose, fruktosa, fructose, glukosa, glucose,
  high-fructose corn syrup (HFCS), madu, honey, sirup, syrup, agave, molasses, dextrose.

"warnings": list any ambiguity. Common examples:
- "Takaran saji tidak tertera — menggunakan ukuran kemasan sebagai takaran saji karena sajian per kemasan = 1."
- "Takaran saji tidak tertera dan ukuran kemasan tidak terlihat — isi secara manual."
- "Tidak ada tabel nilai gizi — nilai diambil dari keterangan lain pada label."
- "Nilai gula tidak terbaca."
- "Label dalam bahasa asing, hasil mungkin kurang akurat."`
