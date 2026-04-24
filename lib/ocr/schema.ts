import { z } from 'zod'

export const ocrResultSchema = z.object({
  takaran_saji_ml: z.number().positive().nullable(),
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

// Fields required before we can calculate a level
export const REQUIRED_FIELDS = [
  'takaran_saji_ml',
  'gula_total_g',
  'natrium_mg',
  'lemak_jenuh_g',
] as const

export function getMissingFields(result: OcrResult): string[] {
  return REQUIRED_FIELDS.filter((f) => result[f] === null).map((f) => {
    const labels: Record<string, string> = {
      takaran_saji_ml: 'takaran saji (ml)',
      gula_total_g: 'gula (g)',
      natrium_mg: 'natrium (mg)',
      lemak_jenuh_g: 'lemak jenuh (g)',
    }
    return labels[f] ?? f
  })
}
