'use client'

import { useEffect, useRef, useState } from 'react'

// Unique DOM id for the html5-qrcode container.
// Only one scanner can exist per page anyway.
const CONTAINER_ID = 'sg-barcode-scanner'

type Status = 'starting' | 'active' | 'denied'

type Props = {
  onScan: (code: string) => void
}

export function BarcodeScanner({ onScan }: Props) {
  const [status, setStatus] = useState<Status>('starting')
  // Stable ref so the scanner callback always calls the latest onScan
  const onScanRef = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    let isMounted = true
    // Prevent the success callback from firing more than once
    let alreadyScanned = false

    async function start() {
      try {
        // Dynamic import keeps html5-qrcode out of the server bundle entirely
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (!isMounted) return

        const scanner = new Html5Qrcode(CONTAINER_ID, {
          // Only scan product barcode formats — skips QR parsing overhead
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          verbose: false,
        })

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            // Rectangular scan box — better fit for landscape barcodes
            qrbox: { width: 260, height: 100 },
          },
          (decoded) => {
            if (alreadyScanned) return
            alreadyScanned = true
            // Stop immediately so the camera releases
            scanner.stop().catch(() => {})
            onScanRef.current(decoded)
          },
          undefined // frame-level errors — ignore
        )

        if (isMounted) setStatus('active')

        return () => { scanner.stop().catch(() => {}) }
      } catch {
        if (isMounted) setStatus('denied')
      }
    }

    const cleanup = start()

    return () => {
      isMounted = false
      cleanup.then(fn => fn?.()).catch(() => {})
    }
  }, []) // run once on mount

  return (
    <div className="flex flex-col gap-3">
      {/* html5-qrcode renders the video + scan-box overlay into this div */}
      <div
        id={CONTAINER_ID}
        className="w-full rounded-2xl overflow-hidden"
        style={{ minHeight: 240, background: 'var(--surface-hi)' }}
      />

      {status === 'starting' && (
        <div className="flex items-center justify-center gap-2 py-1">
          <svg
            className="animate-spin w-4 h-4 shrink-0"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--action)' }} aria-hidden
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
          <p className="text-xs" style={{ color: 'var(--tx-3)' }}>Meminta akses kamera…</p>
        </div>
      )}

      {status === 'denied' && (
        <p
          className="text-xs text-center rounded-xl px-3 py-3 leading-relaxed"
          style={{ color: 'var(--err-tx)', background: 'var(--err-bg)', border: '1px solid var(--err-border)' }}
        >
          Izin kamera ditolak. Aktifkan di pengaturan browser, lalu muat ulang halaman.
        </p>
      )}
    </div>
  )
}
