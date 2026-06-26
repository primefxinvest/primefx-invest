import type { Metadata } from 'next'
import { ContactContent } from '@/components/public/ContactContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

const TITLE = 'Contact Us'
const DESCRIPTION =
  'Contact PrimeFx Invest for investor support, compliance questions, partnerships, and general inquiries.'

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/contact',
  keywords: ['contact PrimeFx', 'investor support', 'customer service', 'help center'],
})

export default function ContactPage() {
  return (
    <>
      <JsonLd data={webPageJsonLd({ title: TITLE, description: DESCRIPTION, path: '/contact' })} />
      <ContactContent />
    </>
  )
}
