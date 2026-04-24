// Supabase database types — mirrors the products table schema.
// Validated at API boundaries with Zod (see lib/supabase/schema.ts).

export type Level = 'A' | 'B' | 'C' | 'D'

// Recognised product categories. Matches the CHECK constraint on the DB column.
// 'minuman' is the default and the only category with fully-calibrated GGL
// thresholds (KMK 301/2026). Other categories use the same formula but note
// that official thresholds for non-beverages come from separate regulations.
export type Category = 'minuman' | 'snack' | 'makanan' | 'lainnya'

export const CATEGORY_LABEL: Record<Category, string> = {
  minuman: 'Minuman',
  snack:   'Snack',
  makanan: 'Makanan',
  lainnya: 'Lainnya',
}

export type ProductRow = {
  id: string
  nama: string
  merek: string | null
  varian: string | null
  ukuran_ml: number | null
  category: Category
  gula_total_g: number | null
  laktosa_g: number | null
  natrium_mg: number | null
  lemak_jenuh_g: number | null
  takaran_saji_ml: number
  has_sweetener_additive: boolean | null
  has_only_natural_sweetener: boolean | null
  level: Level
  worst_nutrient: string
  worst_display_percent: number | null
  image_url: string | null
  created_at: string
}

export type ProductInsert = Omit<ProductRow, 'id' | 'created_at'>

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductRow
        Insert: ProductInsert
        Update: Partial<ProductInsert>
      }
    }
  }
}
