import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  noIndex: true,
  title: 'Sign In',
  description: 'Sign in to your PrimeFx Invest investor dashboard.',
  path: '/login',
})

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
