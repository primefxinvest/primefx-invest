import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ContactContent } from '@/components/public/ContactContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return buildPageMetadata({
    title: t('contactTitle'),
    description: t('contactDescription'),
    path: '/contact',
    keywords: ['contact PrimeFx', 'investor support', 'customer service', 'help center'],
  })
}

export default async function ContactPage() {
  const t = await getTranslations('meta')
  const title = t('contactTitle')
  const description = t('contactDescription')

  return (
    <>
      <JsonLd data={webPageJsonLd({ title, description, path: '/contact' })} />
      <ContactContent />
    </>
  )
}
