import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { faqPageJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return buildPageMetadata({
    title: t('marketingTitle'),
    description: t('marketingDescription'),
    path: '/',
    keywords: [
      'AI investment platform',
      'invest online',
      'PrimeFx Invest',
      'crypto investing',
      'wealth management app',
    ],
  })
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={faqPageJsonLd()} />
      {children}
    </>
  )
}
