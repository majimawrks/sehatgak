'use client'

import { useEffect, useRef, useState } from 'react'

type Status = 'starting' | 'active' | 'denied'

type Props = {
  onScan: (code: string) => void
}

export function BarcodeScanner({ onScan }: Props) {
  const [status, setStatus] = useState<Status>('starting')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // Stable ref so the decode callback always calls the latest onScan
  const onScanRef = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    let isMounted = true
    // Prevent the success callback from firing more than once
    let alreadyScanned = false
    // IScannerControls from @zxing/browser — used to release the camera on unmount
    let controls: { stop: () => void } | null = null

    async function start() {
      try {
        // Dynamic import keeps @zxing/browser out of the server bundle entirely
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (!isMounted) return

        // No format hints — DecodeHintType is not re-exported by @zxing/browser.
        // BrowserMultiFormatReader defaults to all supported formats, which is fine
        // for product barcodes (EAN-13, UPC-A, etc.).
        const reader = new BrowserMultiFormatReader()
        const videoEl = videoRef.current
        if (!videoEl) return

        // decodeFromConstraints uses getUserMedia under the hood — works on iOS Safari
        // when the page is served over HTTPS (Netlify provides this).
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoEl,
          (result) => {
            if (!result || alreadyScanned) return
            alreadyScanned = true
            controls?.stop()
            onScanRef.current(result.getText())
          }
        )

        if (isMounted) setStatus('active')
      } catch {
        if (isMounted) setStatus('denied')
      }
    }

    start()

    return () => {
      isMounted = false
      controls?.stop()
    }
  }, []) // run once on mount

  return (
    <div className="flex flex-col gap-3">
      {/* @zxing attaches the camera stream to this video element */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ minHeight: 240, background: 'var(--surface-hi)' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ minHeight: 240 }}
          muted
          playsInline
          autoPlay
        />
      </div>

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
