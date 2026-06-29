import type { Metadata } from 'next'
import { NotFoundPage } from '@/components/shared/NotFoundPage'
import { getNotFoundMetadata } from '@/lib/i18n/not-found'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getNotFoundMetadata()
  return buildPageMetadata({
    title,
    description,
    path: '/admin/404',
    noIndex: true,
  })
}

export default function AdminNotFound() {
  return <NotFoundPage variant="admin" nativeHomeLink withIntlProvider />
}
