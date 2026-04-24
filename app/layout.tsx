import type { Metadata } from 'next'
import './globals.css'
import { DisclaimerModal } from '@/components/DisclaimerModal'

export const metadata: Metadata = {
  title: 'SehatGak — Cek Nutri-Level Minumanmu',
  description: 'Scan label minuman dan ketahui Nutri-Level A/B/C/D sesuai KMK 301/2026.',
}

// Inline script that runs synchronously before first paint to prevent
// flash of wrong theme. Reads localStorage and applies .dark to <html>
// before React hydrates.
const themeScript = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
`

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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <DisclaimerModal />
        {children}
      </body>
    </html>
  )
}
