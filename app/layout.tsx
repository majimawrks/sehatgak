import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SehatGak — Cek Nutri-Level Minumanmu',
  description: 'Scan label minuman dan ketahui Nutri-Level A/B/C/D sesuai KMK 301/2026.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
