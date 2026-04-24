'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NutriLevelBadge } from '@/components/NutriLevelBadge'
import { NutrientBreakdown } from '@/components/NutrientBreakdown'
import { ThemeToggle } from '@/components/ThemeToggle'
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
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
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
    nama:                     ocr.nama_produk ?? '',
    merek:                    ocr.merek ?? '',
    takaran_saji_ml:          ocr.takaran_saji_ml?.toString() ?? '',
    gula_total_g:             ocr.gula_total_g?.toString() ?? '',
    laktosa_g:                ocr.laktosa_g?.toString() ?? '',
    natrium_mg:               ocr.natrium_mg?.toString() ?? '',
    lemak_jenuh_g:            ocr.lemak_jenuh_g?.toString() ?? '',
    has_sweetener_additive:   ocr.pemanis_tambahan.ada,
    has_only_natural_sweetener: ocr.pemanis_tambahan.hanya_alami,
  }
}

function fieldsToCalcInput(f: FormFields) {
  return {
    gulaTotalGram:          parseFloat(f.gula_total_g) || 0,
    laktosaGram:            f.laktosa_g ? parseFloat(f.laktosa_g) : undefined,
    natriumMg:              parseFloat(f.natrium_mg) || 0,
    lemakJenuhGram:         parseFloat(f.lemak_jenuh_g) || 0,
    takaranSajiMl:          parseFloat(f.takaran_saji_ml) || 100,
    hasSweetenerAdditive:   f.has_sweetener_additive,
    hasOnlyNaturalSweetener:f.has_only_natural_sweetener,
  }
}

export function ScanClient() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('pick')
  const [errorMsg, setErrorMsg] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [noNutritionTable, setNoNutritionTable] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fields, setFields] = useState<FormFields>({
    nama: '', merek: '', takaran_saji_ml: '', gula_total_g: '',
    laktosa_g: '', natrium_mg: '', lemak_jenuh_g: '',
    has_sweetener_additive: false, has_only_natural_sweetener: false,
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
    setNoNutritionTable(false)

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
    setNoNutritionTable(!ocr.has_nutrition_table)
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
      nama:                    fields.nama.trim(),
      merek:                   fields.merek.trim() || null,
      takaran_saji_ml:         parseFloat(fields.takaran_saji_ml),
      gula_total_g:            parseFloat(fields.gula_total_g),
      laktosa_g:               fields.laktosa_g ? parseFloat(fields.laktosa_g) : null,
      natrium_mg:              parseFloat(fields.natrium_mg),
      lemak_jenuh_g:           parseFloat(fields.lemak_jenuh_g),
      has_sweetener_additive:  fields.has_sweetener_additive,
      has_only_natural_sweetener: fields.has_only_natural_sweetener,
      level:                   result.level,
      worst_nutrient:          result.worstNutrient,
      worst_display_percent:   result.worstDisplayPercent,
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const j = await res.json() as Record<string, unknown>
      setErrorMsg((j.error as string) ?? 'Gagal menyimpan produk.')
      setStep('result')
      return
    }

    router.push('/')
  }

  const result = calcResult()

  return (
    <main className="flex-1 flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 px-4 py-3.5"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-1 text-sm font-semibold transition-colors"
              style={{ color: 'var(--tx-3)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Kembali
            </a>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--tx-1)' }}>
              Scan Produk
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* ─────────────────────────── Step: pick ──────────────────── */}
        {step === 'pick' && (
          <section className="flex flex-col items-center gap-4 py-6">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 py-14 transition-colors cursor-pointer"
              style={{
                border: '2px dashed var(--border)',
                background: 'var(--surface)',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--tx-3)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface-hi)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-2)' }} aria-hidden>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: 'var(--tx-1)' }}>
                  Foto label gizi
                </p>
                <p className="text-xs mt-1 leading-relaxed max-w-[200px]" style={{ color: 'var(--tx-3)' }}>
                  Ketuk untuk memilih foto atau gunakan kamera. Bisa foto tabel gizi atau daftar bahan.
                </p>
              </div>
            </button>
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

        {/* ─────────────────────────── Step: scanning ──────────────── */}
        {step === 'scanning' && (
          <section className="flex flex-col items-center gap-5 py-12">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview label"
                className="w-48 rounded-2xl object-cover"
                style={{ boxShadow: 'var(--shadow-card)' }}
              />
            )}
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={{ color: 'var(--action)' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: 'var(--tx-1)' }}>
                Membaca label gizi…
              </span>
            </div>
          </section>
        )}

        {/* ─────────────────────────── Step: error ─────────────────── */}
        {step === 'error' && (
          <section className="flex flex-col gap-4 py-4">
            <div
              className="rounded-2xl px-4 py-4"
              style={{ background: 'var(--err-bg)', border: '1px solid var(--err-border)' }}
            >
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--err-tx)' }}>
                Gagal memindai
              </p>
              <p className="text-sm" style={{ color: 'var(--err-tx)' }}>{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => { setStep('pick'); setPreview(null) }}
              className="rounded-full px-6 py-2.5 font-bold text-sm transition-colors"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--tx-1)',
              }}
            >
              Coba Lagi
            </button>
          </section>
        )}

        {/* ─────────────────────────── Step: result / saving ───────── */}
        {(step === 'result' || step === 'saving') && (
          <section className="flex flex-col gap-5">

            {/* No nutrition table banner */}
            {noNutritionTable && (
              <div
                className="rounded-2xl px-4 py-3.5 flex gap-3 items-start"
                style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)' }}
              >
                <span className="text-base shrink-0 mt-0.5">📋</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--warn-tx)' }}>
                    Tabel gizi tidak ditemukan
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--warn-tx)' }}>
                    Produk ini mungkin tidak memiliki tabel nilai gizi standar. Pemanis tambahan dideteksi dari daftar bahan. Isi nilai gizi di bawah secara manual untuk menghitung Nutri-Level.
                  </p>
                </div>
              </div>
            )}

            {/* OCR warnings */}
            {warnings.length > 0 && (
              <div
                className="rounded-2xl px-4 py-3.5"
                style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--warn-tx)' }}>
                  Perhatian
                </p>
                <ul className="flex flex-col gap-1">
                  {warnings.map((w) => (
                    <li key={w} className="text-xs flex gap-1.5" style={{ color: 'var(--warn-tx)' }}>
                      <span className="shrink-0">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save error */}
            {errorMsg && (
              <div
                className="rounded-2xl px-4 py-3.5"
                style={{ background: 'var(--err-bg)', border: '1px solid var(--err-border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--err-tx)' }}>{errorMsg}</p>
              </div>
            )}

            {/* Live Nutri-Level preview */}
            {result && (
              <div
                className="rounded-2xl px-5 py-5 flex flex-col gap-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <NutriLevelBadge result={result} />
                <NutrientBreakdown result={result} />
              </div>
            )}

            <div style={{ height: '1px', background: 'var(--border)' }} />

            {/* Editable fields */}
            <div className="flex flex-col gap-4">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
                Periksa &amp; Lengkapi Data
              </p>

              <Field label="Nama produk" required>
                <TextInput
                  value={fields.nama}
                  onChange={(v) => setFields({ ...fields, nama: v })}
                  placeholder="Contoh: Teh Oolong 330ml"
                />
              </Field>

              <Field label="Merek">
                <TextInput
                  value={fields.merek}
                  onChange={(v) => setFields({ ...fields, merek: v })}
                  placeholder="Contoh: Sosro"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Takaran saji (ml)" required hint="1 fl oz ≈ 30 ml · 12 fl oz ≈ 355 ml · 1 cl = 10 ml">
                  <NumberInput value={fields.takaran_saji_ml} onChange={(v) => setFields({ ...fields, takaran_saji_ml: v })} />
                </Field>
                <Field label="Gula (g)" required>
                  <NumberInput value={fields.gula_total_g} onChange={(v) => setFields({ ...fields, gula_total_g: v })} />
                </Field>
                <Field label="Laktosa (g)">
                  <NumberInput value={fields.laktosa_g} onChange={(v) => setFields({ ...fields, laktosa_g: v })} placeholder="0" />
                </Field>
                <Field label="Natrium (mg)" required>
                  <NumberInput value={fields.natrium_mg} onChange={(v) => setFields({ ...fields, natrium_mg: v })} />
                </Field>
                <Field label="Lemak jenuh (g)" required>
                  <NumberInput value={fields.lemak_jenuh_g} onChange={(v) => setFields({ ...fields, lemak_jenuh_g: v })} />
                </Field>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: 'var(--tx-1)' }}>
                  <input
                    type="checkbox"
                    checked={fields.has_sweetener_additive}
                    onChange={(e) => setFields({ ...fields, has_sweetener_additive: e.target.checked })}
                    className="rounded"
                  />
                  Mengandung bahan tambahan pemanis
                </label>
                {fields.has_sweetener_additive && (
                  <label className="flex items-center gap-2.5 text-sm ml-6 cursor-pointer" style={{ color: 'var(--tx-2)' }}>
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

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setStep('pick'); setPreview(null); setErrorMsg('') }}
                disabled={step === 'saving'}
                className="flex-1 rounded-full px-4 py-2.5 font-bold text-sm transition-colors disabled:opacity-40"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--tx-1)',
                }}
              >
                Scan Ulang
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={step === 'saving' || !result}
                className="flex-1 rounded-full px-4 py-2.5 font-bold text-sm transition-colors disabled:opacity-40"
                style={{ background: 'var(--action)', color: 'var(--action-fg)' }}
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

/* ── Small helper components ─────────────────────────────────────────────── */

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: 'var(--tx-2)' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: 'var(--nutri-d)' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] leading-snug" style={{ color: 'var(--tx-3)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl px-3 py-2 text-sm outline-none transition-colors'

const inputStyle = {
  background: 'var(--surface-hi)',
  border: '1px solid var(--border)',
  color: 'var(--tx-1)',
}

function TextInput({
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
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
      style={inputStyle}
    />
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
      className={inputClass}
      style={inputStyle}
    />
  )
}
