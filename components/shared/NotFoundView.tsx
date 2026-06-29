'use client'

import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Home } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { shouldSkipLocalePrefix } from '@/lib/i18n/pathname'
import { cn } from '@/lib/utils'

export type NotFoundVariant = 'default' | 'dashboard' | 'auth' | 'public' | 'admin'

const VARIANT_CONFIG: Record<
  NotFoundVariant,
  { homeHref: string; homeLabelKey: string; descriptionKey: string; compact?: boolean }
> = {
  default: {
    homeHref: '/',
    homeLabelKey: 'goHome',
    descriptionKey: 'notFoundDescription',
  },
  public: {
    homeHref: '/',
    homeLabelKey: 'notFoundPublicHome',
    descriptionKey: 'notFoundPublicDescription',
  },
  dashboard: {
    homeHref: '/dashboard',
    homeLabelKey: 'notFoundDashboardHome',
    descriptionKey: 'notFoundDashboardDescription',
  },
  auth: {
    homeHref: '/login',
    homeLabelKey: 'notFoundAuthHome',
    descriptionKey: 'notFoundAuthDescription',
    compact: true,
  },
  admin: {
    homeHref: '/admin',
    homeLabelKey: 'notFoundAdminHome',
    descriptionKey: 'notFoundAdminDescription',
  },
}

interface NotFoundViewProps {
  variant?: NotFoundVariant
  homeHref?: string
  homeLabel?: string
  title?: string
  description?: string
  compact?: boolean
  nativeHomeLink?: boolean
  className?: string
}

export function NotFoundView({
  variant = 'default',
  homeHref,
  homeLabel,
  title,
  description,
  compact,
  nativeHomeLink = false,
  className,
}: NotFoundViewProps) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const config = VARIANT_CONFIG[variant]

  const resolvedHomeHref = homeHref ?? config.homeHref
  const resolvedHomeLabel = homeLabel ?? t(config.homeLabelKey)
  const resolvedDescription = description ?? t(config.descriptionKey)
  const resolvedCompact = compact ?? config.compact ?? false

  const homeLinkClassName =
    'inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        resolvedCompact ? 'py-8' : 'min-h-[50vh] py-12 sm:min-h-[60vh]',
        className
      )}
    >
      <p className="text-7xl font-bold tracking-tight text-[#0052ff]/15 sm:text-8xl">404</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
        {title ?? t('notFoundTitle')}
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 sm:text-base">{resolvedDescription}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {nativeHomeLink || shouldSkipLocalePrefix(resolvedHomeHref) ? (
          <NextLink href={resolvedHomeHref} className={homeLinkClassName}>
            <Home className="h-4 w-4" />
            {resolvedHomeLabel}
          </NextLink>
        ) : (
          <Link href={resolvedHomeHref} className={homeLinkClassName}>
            <Home className="h-4 w-4" />
            {resolvedHomeLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon('back')}
        </button>
      </div>
    </div>
  )
}
