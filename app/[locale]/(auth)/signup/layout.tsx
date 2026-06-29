import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Create Account',
  description:
    'Join PrimeFx Invest — create your free account and start investing with AI-powered plans from $50.',
  path: '/signup',
  keywords: ['sign up', 'create investment account', 'register PrimeFx', 'start investing'],
})

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children
}
