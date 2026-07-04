import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Home } from 'lucide-react'
import { PublicShell } from '@/components/public/PublicShell'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

interface ComingSoonPageProps {
  title: string
  path: string
  withShell?: boolean
}

export async function generateComingSoonMetadata({
  title,
  path,
}: Pick<ComingSoonPageProps, 'title' | 'path'>): Promise<Metadata> {
  const t = await getTranslations('errors')
  return buildPageMetadata({
    title,
    description: t('comingSoonDescription'),
    path,
    noIndex: true,
  })
}

export async function ComingSoonPage({
  title,
  path,
  withShell = true,
}: ComingSoonPageProps) {
  const t = await getTranslations('errors')

  const content = (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[60vh]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#0052ff]">
        {t('comingSoonBadge')}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-md text-sm text-gray-500 sm:text-base">{t('comingSoonDescription')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Home className="h-4 w-4" aria-hidden />
        {t('comingSoonHome')}
      </Link>
    </div>
  )

  if (withShell) {
    return <PublicShell>{content}</PublicShell>
  }

  return content
}
