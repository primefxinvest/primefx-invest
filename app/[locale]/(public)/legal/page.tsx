import type { Metadata } from 'next'
import { LegalContent } from '@/components/public/LegalContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

const TITLE = 'Legal Center'
const DESCRIPTION =
  'PrimeFx Invest terms of service, privacy policy, risk disclosure, AML/KYC compliance, and regulatory information.'

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/legal',
  keywords: ['terms of service', 'privacy policy', 'risk disclosure', 'investment compliance'],
})

export default function LegalPage() {
  return (
    <>
      <JsonLd data={webPageJsonLd({ title: TITLE, description: DESCRIPTION, path: '/legal' })} />
      <LegalContent />
    </>
  )
}
