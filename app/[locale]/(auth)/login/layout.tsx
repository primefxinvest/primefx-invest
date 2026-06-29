import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')

  return buildPageMetadata({
    noIndex: true,
    title: t('metaSignInTitle'),
    description: t('metaSignInDescription'),
    path: '/login',
  })
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
