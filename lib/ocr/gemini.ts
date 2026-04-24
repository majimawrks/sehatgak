import { EXTRACTION_PROMPT } from './prompt'
import { ocrResultSchema } from './schema'
import type { OcrResult } from './schema'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

type GeminiSuccess = { ok: true; data: OcrResult }
type GeminiError = { ok: false; code: 'parse_failed' | 'rate_limited' | 'api_error'; message: string; raw?: string }
export type GeminiResult = GeminiSuccess | GeminiError

export async function extractNutritionLabel(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, code: 'api_error', message: 'GEMINI_API_KEY tidak dikonfigurasi' }
  }

  let response: Response
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      }),
    })
  } catch (err) {
    return { ok: false, code: 'api_error', message: `Gagal menghubungi Gemini: ${String(err)}` }
  }

  if (response.status === 429) {
    return { ok: false, code: 'rate_limited', message: 'Terlalu banyak permintaan. Coba lagi sebentar.' }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { ok: false, code: 'api_error', message: `Gemini error ${response.status}: ${text}` }
  }

  let responseJson: unknown
  try {
    responseJson = await response.json()
  } catch {
    return { ok: false, code: 'parse_failed', message: 'Respons Gemini bukan JSON valid' }
  }

  // Extract the text content from Gemini response structure
  const raw =
    (responseJson as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      ?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, code: 'parse_failed', message: 'Gagal mengurai hasil OCR', raw }
  }

  const validated = ocrResultSchema.safeParse(parsed)
  if (!validated.success) {
    return {
      ok: false,
      code: 'parse_failed',
      message: 'Format hasil OCR tidak sesuai',
      raw,
    }
  }

  return { ok: true, data: validated.data }
}
