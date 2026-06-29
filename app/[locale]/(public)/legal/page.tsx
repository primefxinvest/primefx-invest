import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegalContent } from '@/components/public/LegalContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return buildPageMetadata({
    title: t('legalTitle'),
    description: t('legalDescription'),
    path: '/legal',
    keywords: ['terms of service', 'privacy policy', 'risk disclosure', 'investment compliance'],
  })
}

export default async function LegalPage() {
  const t = await getTranslations('meta')
  const title = t('legalTitle')
  const description = t('legalDescription')

  return (
    <>
      <JsonLd data={webPageJsonLd({ title, description, path: '/legal' })} />
      <LegalContent />
    </>
  )
}
