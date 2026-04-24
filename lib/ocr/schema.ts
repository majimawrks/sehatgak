import { z } from 'zod'

export const ocrResultSchema = z.object({
  // v2: indicates whether a structured nutrition facts panel was detected.
  // false means values were extracted from ingredient list / other label text.
  has_nutrition_table: z.boolean().default(false),
  takaran_saji_ml: z.number().positive().nullable(),
  // v2.2: number of servings per package; used to infer serving size for single-serve products.
  sajian_per_kemasan: z.number().positive().nullable().default(null),
  gula_total_g: z.number().min(0).nullable(),
  laktosa_g: z.number().min(0).nullable(),
  natrium_mg: z.number().min(0).nullable(),
  lemak_jenuh_g: z.number().min(0).nullable(),
  nama_produk: z.string().nullable(),
  merek: z.string().nullable(),
  ukuran_kemasan_ml: z.number().positive().nullable(),
  pemanis_tambahan: z.object({
    ada: z.boolean(),
    hanya_alami: z.boolean(),
    daftar: z.array(z.string()),
  }),
  confidence: z.enum(['high', 'medium', 'low']),
  warnings: z.array(z.string()),
})

export type OcrResult = z.infer<typeof ocrResultSchema>

// Fields required to calculate a Nutri-Level
export const REQUIRED_FIELDS = [
  'takaran_saji_ml',
  'gula_total_g',
  'natrium_mg',
  'lemak_jenuh_g',
] as const

const FIELD_LABELS: Record<string, string> = {
  takaran_saji_ml: 'takaran saji (ml)',
  gula_total_g: 'gula (g)',
  natrium_mg: 'natrium (mg)',
  lemak_jenuh_g: 'lemak jenuh (g)',
}

export function getMissingFields(result: OcrResult): string[] {
  return REQUIRED_FIELDS.filter((f) => result[f] === null).map(
    (f) => FIELD_LABELS[f] ?? f
  )
}
