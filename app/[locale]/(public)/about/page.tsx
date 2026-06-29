import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AboutContent } from '@/components/public/AboutContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return buildPageMetadata({
    title: t('aboutTitle'),
    description: t('aboutDescription'),
    path: '/about',
    keywords: ['about PrimeFx', 'investment company', 'fintech mission', 'AI investing'],
  })
}

export default async function AboutPage() {
  const t = await getTranslations('meta')
  const title = t('aboutTitle')
  const description = t('aboutDescription')

  return (
    <>
      <JsonLd data={webPageJsonLd({ title, description, path: '/about' })} />
      <AboutContent />
    </>
  )
}
