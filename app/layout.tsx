import { Analytics } from '@vercel/analytics/next'
import { Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`light ${outfit.variable} overflow-x-hidden`} suppressHydrationWarning>
      <body className="overflow-x-hidden font-sans antialiased bg-[#f5f7fa] text-gray-900">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
