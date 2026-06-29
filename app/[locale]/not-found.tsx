import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('errors')
  return buildPageMetadata({
    title: t('notFoundTitle'),
    description: t('notFoundDescription'),
    path: '/404',
    noIndex: true,
  })
}

export default function NotFound() {
  return <NotFoundPage shell="public" />
}
