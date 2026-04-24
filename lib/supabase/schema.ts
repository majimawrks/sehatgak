import { z } from 'zod'

const levelSchema = z.enum(['A', 'B', 'C', 'D'])

export const categorySchema = z.enum(['minuman', 'snack', 'makanan', 'lainnya'])

// Zod schema for validating POST /api/products request body
export const productInsertSchema = z.object({
  nama: z.string().min(1, 'Nama produk wajib diisi'),
  merek: z.string().nullable().optional(),
  varian: z.string().nullable().optional(),
  ukuran_ml: z.number().positive().nullable().optional(),
  category: categorySchema.default('minuman'),
  gula_total_g: z.number().min(0).nullable().optional(),
  laktosa_g: z.number().min(0).nullable().optional(),
  natrium_mg: z.number().min(0).nullable().optional(),
  lemak_jenuh_g: z.number().min(0).nullable().optional(),
  takaran_saji_ml: z.number().positive('Takaran saji wajib diisi'),
  has_sweetener_additive: z.boolean().nullable().optional(),
  has_only_natural_sweetener: z.boolean().nullable().optional(),
  level: levelSchema,
  worst_nutrient: z.string().min(1),
  worst_display_percent: z.number().int().min(0).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
})

export type ProductInsertInput = z.infer<typeof productInsertSchema>

// Zod schema for validating a row returned from Supabase
export const productRowSchema = productInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string(),
})

export type ProductRowOutput = z.infer<typeof productRowSchema>
