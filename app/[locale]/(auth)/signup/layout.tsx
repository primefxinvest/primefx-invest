import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')

  return buildPageMetadata({
    noIndex: true,
    title: t('metaSignUpTitle'),
    description: t('metaSignUpDescription'),
    path: '/signup',
    keywords: ['sign up', 'create investment account', 'register PrimeFx', 'start investing'],
  })
}

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children
}
