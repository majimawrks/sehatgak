'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NutriLevelBadge } from '@/components/NutriLevelBadge'
import { NutrientBreakdown } from '@/components/NutrientBreakdown'
import { calculateLevel } from '@/lib/nutrilevel'
import type { OcrResult } from '@/lib/ocr/schema'
import type { CalcResultOk } from '@/lib/nutrilevel/types'

type Step = 'pick' | 'scanning' | 'result' | 'saving' | 'error'

type FormFields = {
  nama: string
  merek: string
  takaran_saji_ml: string
  gula_total_g: string
  laktosa_g: string
  natrium_mg: string
  lemak_jenuh_g: string
  has_sweetener_additive: boolean
  has_only_natural_sweetener: boolean
}

// Compress image client-side to max 1600px long edge before uploading.
// Keeps Gemini costs and latency down.
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Gagal mengompres gambar'))
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => reject(new Error('Gambar tidak valid'))
    img.src = url
  })
}

function ocrToFormFields(ocr: OcrResult): FormFields {
  return {
    nama: ocr.nama_produk ?? '',
    merek: ocr.merek ?? '',
    takaran_saji_ml: ocr.takaran_saji_ml?.toString() ?? '',
    gula_total_g: ocr.gula_total_g?.toString() ?? '',
    laktosa_g: ocr.laktosa_g?.toString() ?? '',
    natrium_mg: ocr.natrium_mg?.toString() ?? '',
    lemak_jenuh_g: ocr.lemak_jenuh_g?.toString() ?? '',
    has_sweetener_additive: ocr.pemanis_tambahan.ada,
    has_only_natural_sweetener: ocr.pemanis_tambahan.hanya_alami,
  }
}

function fieldsToCalcInput(f: FormFields) {
  return {
    gulaTotalGram: parseFloat(f.gula_total_g) || 0,
    laktosaGram: f.laktosa_g ? parseFloat(f.laktosa_g) : undefined,
    natriumMg: parseFloat(f.natrium_mg) || 0,
    lemakJenuhGram: parseFloat(f.lemak_jenuh_g) || 0,
    takaranSajiMl: parseFloat(f.takaran_saji_ml) || 100,
    hasSweetenerAdditive: f.has_sweetener_additive,
    hasOnlyNaturalSweetener: f.has_only_natural_sweetener,
  }
}

export function ScanClient() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('pick')
  const [errorMsg, setErrorMsg] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [fields, setFields] = useState<FormFields>({
    nama: '',
    merek: '',
    takaran_saji_ml: '',
    gula_total_g: '',
    laktosa_g: '',
    natrium_mg: '',
    lemak_jenuh_g: '',
    has_sweetener_additive: false,
    has_only_natural_sweetener: false,
  })

  function calcResult(): CalcResultOk | null {
    const input = fieldsToCalcInput(fields)
    if (!input.takaranSajiMl) return null
    const result = calculateLevel(input)
    if (result.exempt) return null
    return result
  }

  async function handleFile(file: File) {
    setStep('scanning')
    setErrorMsg('')
    setWarnings([])

    // Show preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    let blob: Blob
    try {
      blob = await compressImage(file)
    } catch {
      setErrorMsg('Gagal memproses gambar. Coba gunakan foto lain.')
      setStep('error')
      return
    }

    const form = new FormData()
    form.append('image', new File([blob], 'label.jpg', { type: 'image/jpeg' }))

    let res: Response
    try {
      res = await fetch('/api/ocr', { method: 'POST', body: form })
    } catch {
      setErrorMsg('Gagal menghubungi server. Periksa koneksi internet.')
      setStep('error')
      return
    }

    const json = await res.json() as Record<string, unknown>

    if (!res.ok) {
      setErrorMsg((json.error as string) ?? 'Terjadi kesalahan saat memindai label.')
      setStep('error')
      return
    }

    const ocr = json as OcrResult
    setFields(ocrToFormFields(ocr))
    setWarnings(ocr.warnings ?? [])
    setStep('result')
  }

  async function handleSave() {
    const result = calcResult()
    if (!result) {
      setErrorMsg('Lengkapi semua nilai gizi sebelum menyimpan.')
      return
    }
    if (!fields.nama.trim()) {
      setErrorMsg('Nama produk wajib diisi.')
      return
    }

    setStep('saving')

    const body = {
      nama: fields.nama.trim(),
      merek: fields.merek.trim() || null,
      takaran_saji_ml: parseFloat(fields.takaran_saji_ml),
      gula_total_g: parseFloat(fields.gula_total_g),
      laktosa_g: fields.laktosa_g ? parseFloat(fields.laktosa_g) : null,
      natrium_mg: parseFloat(fields.natrium_mg),
      lemak_jenuh_g: parseFloat(fields.lemak_jenuh_g),
      has_sweetener_additive: fields.has_sweetener_additive,
      has_only_natural_sweetener: fields.has_only_natural_sweetener,
      level: result.level,
      worst_nutrient: result.worstNutrient,
      worst_display_percent: result.worstDisplayPercent,
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json() as Record<string, unknown>
      setErrorMsg((json.error as string) ?? 'Gagal menyimpan produk.')
      setStep('result')
      return
    }

    router.push('/')
  }

  const result = calcResult()

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-gray-700 text-sm">← Kembali</a>
          <span className="text-base font-black tracking-tight">Scan Produk</span>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* Step: pick */}
        {step === 'pick' && (
          <section className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <span className="text-4xl">📷</span>
              <p className="font-bold text-gray-700">Foto label gizi</p>
              <p className="text-sm text-gray-400 text-center px-4">
                Ketuk untuk memilih foto atau gunakan kamera
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </section>
        )}

        {/* Step: scanning */}
        {step === 'scanning' && (
          <section className="flex flex-col items-center gap-4 py-12">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview label" className="w-48 rounded-xl object-cover shadow" />
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <span className="animate-spin text-xl">⏳</span>
              <span className="font-medium">Membaca label gizi…</span>
            </div>
          </section>
        )}

        {/* Step: error */}
        {step === 'error' && (
          <section className="flex flex-col gap-4">
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-4">
              <p className="font-bold text-red-700 mb-1">Gagal memindai</p>
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
            <button
              onClick={() => { setStep('pick'); setPreview(null) }}
              className="rounded-full px-6 py-3 font-bold text-sm border border-gray-300 hover:bg-gray-50"
            >
              Coba Lagi
            </button>
          </section>
        )}

        {/* Step: result / saving */}
        {(step === 'result' || step === 'saving') && (
          <section className="flex flex-col gap-6">

            {/* OCR warnings */}
            {warnings.length > 0 && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 mb-1">Perhatian</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {warnings.map((w) => (
                    <li key={w} className="text-sm text-yellow-800">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save error */}
            {errorMsg && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            {/* Live result preview */}
            {result && (
              <div className="flex flex-col gap-4">
                <NutriLevelBadge result={result} />
                <NutrientBreakdown result={result} />
              </div>
            )}

            <div className="border-t border-gray-100" />

            {/* Editable fields */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Periksa & Lengkapi Data
              </p>

              <Field label="Nama produk *" required>
                <input
                  type="text"
                  value={fields.nama}
                  onChange={(e) => setFields({ ...fields, nama: e.target.value })}
                  placeholder="Contoh: Teh Oolong 330ml"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </Field>

              <Field label="Merek">
                <input
                  type="text"
                  value={fields.merek}
                  onChange={(e) => setFields({ ...fields, merek: e.target.value })}
                  placeholder="Contoh: Sosro"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Takaran saji (ml) *" required>
                  <NumberInput value={fields.takaran_saji_ml} onChange={(v) => setFields({ ...fields, takaran_saji_ml: v })} />
                </Field>
                <Field label="Gula (g) *" required>
                  <NumberInput value={fields.gula_total_g} onChange={(v) => setFields({ ...fields, gula_total_g: v })} />
                </Field>
                <Field label="Laktosa (g)">
                  <NumberInput value={fields.laktosa_g} onChange={(v) => setFields({ ...fields, laktosa_g: v })} placeholder="0" />
                </Field>
                <Field label="Natrium (mg) *" required>
                  <NumberInput value={fields.natrium_mg} onChange={(v) => setFields({ ...fields, natrium_mg: v })} />
                </Field>
                <Field label="Lemak jenuh (g) *" required>
                  <NumberInput value={fields.lemak_jenuh_g} onChange={(v) => setFields({ ...fields, lemak_jenuh_g: v })} />
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fields.has_sweetener_additive}
                    onChange={(e) => setFields({ ...fields, has_sweetener_additive: e.target.checked })}
                    className="rounded"
                  />
                  Mengandung bahan tambahan pemanis
                </label>
                {fields.has_sweetener_additive && (
                  <label className="flex items-center gap-2 text-sm ml-6">
                    <input
                      type="checkbox"
                      checked={fields.has_only_natural_sweetener}
                      onChange={(e) => setFields({ ...fields, has_only_natural_sweetener: e.target.checked })}
                      className="rounded"
                    />
                    Hanya pemanis alami (stevia, eritritol, dll.)
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('pick'); setPreview(null); setErrorMsg('') }}
                className="flex-1 rounded-full px-4 py-3 font-bold text-sm border border-gray-300 hover:bg-gray-50"
                disabled={step === 'saving'}
              >
                Scan Ulang
              </button>
              <button
                onClick={handleSave}
                disabled={step === 'saving' || !result}
                className="flex-1 rounded-full px-4 py-3 font-bold text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--nutri-a)' }}
              >
                {step === 'saving' ? 'Menyimpan…' : 'Simpan Produk'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

// Small helper components to keep JSX clean

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  placeholder = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
    />
  )
}
