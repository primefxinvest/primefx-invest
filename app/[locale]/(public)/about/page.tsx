import type { Metadata } from 'next'
import { AboutContent } from '@/components/public/AboutContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

const TITLE = 'About Us'
const DESCRIPTION =
  'Learn about PrimeFx Invest — our mission to democratize investing with AI, security-first infrastructure, and transparent investment plans.'

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/about',
  keywords: ['about PrimeFx', 'investment company', 'fintech mission', 'AI investing'],
})

export default function AboutPage() {
  return (
    <>
      <JsonLd data={webPageJsonLd({ title: TITLE, description: DESCRIPTION, path: '/about' })} />
      <AboutContent />
    </>
  )
}
