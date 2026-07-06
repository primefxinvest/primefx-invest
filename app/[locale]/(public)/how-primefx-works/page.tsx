import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HowPrimefxWorksContent } from '@/components/public/how-primefx-works/HowPrimefxWorksContent'
import { JsonLd } from '@/components/seo/JsonLd'
import { FAQ_ITEMS } from '@/lib/how-primefx-works/content'
import { faqPageJsonLd, webPageJsonLd } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return buildPageMetadata({
    title: t('howPrimefxWorksTitle'),
    description: t('howPrimefxWorksDescription'),
    path: '/how-primefx-works',
    keywords: [
      'how PrimeFx works',
      'investment guide',
      'crypto investing',
      'weekly profits',
      'referral program',
      'KYC verification',
      'PrimeAI',
      'investment plans',
    ],
  })
}

export default async function HowPrimefxWorksPage() {
  const t = await getTranslations('meta')
  const title = t('howPrimefxWorksTitle')
  const description = t('howPrimefxWorksDescription')

  return (
    <>
      <JsonLd data={webPageJsonLd({ title, description, path: '/how-primefx-works' })} />
      <JsonLd
        data={faqPageJsonLd(
          FAQ_ITEMS.map((item) => ({
            question: item.question,
            answer: item.answer,
          }))
        )}
      />
      <HowPrimefxWorksContent />
    </>
  )
}
