import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { JsonLd } from '@/components/seo/JsonLd'
import { faqPageJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Invest Smarter with AI',
  description:
    'Grow your wealth with PrimeFx Invest — AI-powered investment plans, secure wallets, weekly payouts, and a full investor dashboard.',
  path: '/',
  keywords: [
    'AI investment platform',
    'invest online',
    'PrimeFx Invest',
    'crypto investing',
    'wealth management app',
  ],
})

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
