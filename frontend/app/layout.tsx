import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AGRIVO — Climate-Smart Irrigation, Powered by AI',
  description: 'AI-powered climate-smart irrigation recommendation platform for rice farmers. Make data-driven decisions based on weather, soil conditions, and crop growth stage.',
  keywords: 'irrigation, rice farming, climate smart agriculture, AWD, alternate wetting drying, AI farming',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#14532D' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" style={{ background: '#FAF8F3' }}>
      <body className="antialiased" style={{ background: '#FAF8F3', fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

