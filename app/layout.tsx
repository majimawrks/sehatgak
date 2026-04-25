import type { Metadata } from 'next'
import './globals.css'
import { DisclaimerModal } from '@/components/DisclaimerModal'

export const metadata: Metadata = {
  title: 'SehatGak — Cek Nutri-Level Minumanmu',
  description: 'Scan label minuman dan ketahui Nutri-Level A/B/C/D sesuai KMK HK.01.07/MENKES/301/2026.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: the .dark class may differ between server
    // render and client (theme depends on localStorage / media query).
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        {/* Runs before first paint to prevent flash of wrong theme. Served from
            /theme.js so CSP can use script-src 'self' without unsafe-inline. */}
        <script src="/theme.js" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <DisclaimerModal />
        {children}
      </body>
    </html>
  )
}
