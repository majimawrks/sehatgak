import { NextResponse } from 'next/server'
import { extractNutritionLabel } from '@/lib/ocr/gemini'
import { getMissingFields } from '@/lib/ocr/schema'
import type { OcrResult } from '@/lib/ocr/schema'
import { isAllowedOrigin } from '@/lib/http/origin'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMime = (typeof ALLOWED_TYPES)[number]

// POST /api/ocr — accepts multipart/form-data with an "image" field.
// Always returns 200 with OcrResult when Gemini parsing succeeds, even for
// products without a nutrition table — missing fields are surfaced via
// OcrResult.warnings so the user can complete them in the edit form.
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origin tidak diizinkan' }, { status: 403 })
  }

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

  // Magic-byte sniff: reject files whose actual bytes don't match the declared MIME.
  // JPEG: FF D8 FF  |  PNG: 89 50 4E 47  |  WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  const bytes = new Uint8Array(buffer)
  function sniffMime(b: Uint8Array): AllowedMime | null {
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
    if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
    if (
      b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
    ) return 'image/webp'
    return null
  }
  const sniffed = sniffMime(bytes)
  if (!sniffed || sniffed !== (file.type as AllowedMime)) {
    return NextResponse.json({ error: 'Gambar tidak valid atau format tidak sesuai.' }, { status: 422 })
  }

  const base64 = Buffer.from(buffer).toString('base64')

  const result = await extractNutritionLabel(base64, file.type as AllowedMime)

  if (!result.ok) {
    console.error('[ocr]', result.code, result.message, result.raw ?? '')
    const status = result.code === 'rate_limited' ? 503 : 422
    const userMessage =
      result.code === 'rate_limited'
        ? 'Terlalu banyak permintaan. Coba lagi sebentar.'
        : 'Gagal memindai label. Coba foto ulang atau isi manual.'
    return NextResponse.json({ error: userMessage }, { status })
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
    // Give a more specific hint for missing serving size: if we know the package
    // volume, suggest it as a fallback rather than leaving the user guessing.
    const missedServing = missing.includes('takaran saji (ml)')
    const otherMissing = missing.filter((f) => f !== 'takaran saji (ml)')

    if (missedServing) {
      const pkg = result.data.ukuran_kemasan_ml
      if (pkg) {
        extraWarnings.push(
          `Takaran saji tidak tertera. Ukuran kemasan terdeteksi ${pkg} ml — ` +
          `jika label bertuliskan "1 sajian per kemasan", gunakan ${pkg} ml sebagai takaran saji.`
        )
      } else {
        extraWarnings.push(
          'Takaran saji tidak tertera dan ukuran kemasan tidak terlihat. ' +
          'Coba foto bagian lain kemasan yang menampilkan volume (mis. sisi botol), ' +
          'atau isi secara manual.'
        )
      }
    }

    if (otherMissing.length > 0) {
      extraWarnings.push(
        `Nilai berikut tidak terbaca: ${otherMissing.join(', ')}. Periksa foto atau isi secara manual.`
      )
    }
  }

  const data: OcrResult = {
    ...result.data,
    warnings: [...result.data.warnings, ...extraWarnings],
  }

  return NextResponse.json(data)
}
