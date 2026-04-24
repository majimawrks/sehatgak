import { NextResponse } from 'next/server'
import { extractNutritionLabel } from '@/lib/ocr/gemini'
import { getMissingFields } from '@/lib/ocr/schema'
import type { OcrResult } from '@/lib/ocr/schema'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMime = (typeof ALLOWED_TYPES)[number]

// POST /api/ocr — accepts multipart/form-data with an "image" field.
// Always returns 200 with OcrResult when Gemini parsing succeeds, even for
// products without a nutrition table — missing fields are surfaced via
// OcrResult.warnings so the user can complete them in the edit form.
export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })
  }

  const file = formData.get('image')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Field "image" wajib diisi' }, { status: 422 })
  }

  if (!ALLOWED_TYPES.includes(file.type as AllowedMime)) {
    return NextResponse.json(
      { error: 'Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.' },
      { status: 422 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Ukuran gambar maksimal 5MB' }, { status: 422 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const result = await extractNutritionLabel(base64, file.type as AllowedMime)

  if (!result.ok) {
    const status = result.code === 'rate_limited' ? 503 : 422
    return NextResponse.json(
      { error: result.message, ...(result.raw ? { raw: result.raw } : {}) },
      { status }
    )
  }

  // Append machine-generated warnings for missing required fields and
  // ingredient-only labels so the UI can guide the user to fill them manually.
  const missing = getMissingFields(result.data)
  const extraWarnings: string[] = []

  if (!result.data.has_nutrition_table) {
    extraWarnings.push(
      'Tabel nilai gizi tidak ditemukan — nilai diambil dari keterangan lain pada label, atau isi secara manual.'
    )
  }

  if (missing.length > 0) {
    extraWarnings.push(
      `Nilai berikut tidak terbaca: ${missing.join(', ')}. Periksa foto atau isi secara manual.`
    )
  }

  const data: OcrResult = {
    ...result.data,
    warnings: [...result.data.warnings, ...extraWarnings],
  }

  return NextResponse.json(data)
}
