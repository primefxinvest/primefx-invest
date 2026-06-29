import { NotFoundView } from '@/components/shared/NotFoundView'
import { PublicShell } from '@/components/public/PublicShell'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata = buildPageMetadata({
  title: 'Page Not Found',
  description: 'The page you requested could not be found.',
  path: '/404',
  noIndex: true,
})

export default function NotFound() {
  return (
    <PublicShell>
      <NotFoundView />
    </PublicShell>
  )
}
