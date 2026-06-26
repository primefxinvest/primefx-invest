import { Analytics } from '@vercel/analytics/next'
import type { Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { rootMetadata } from '@/lib/seo/metadata'
import './globals.css'

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = rootMetadata

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#0052ff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#f5f7fa] text-gray-900">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
