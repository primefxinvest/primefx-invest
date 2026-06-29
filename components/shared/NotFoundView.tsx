'use client'

import { useTranslations } from 'next-intl'
import { ArrowLeft, Home } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface NotFoundViewProps {
  homeHref?: string
  homeLabel?: string
  title?: string
  description?: string
  compact?: boolean
  className?: string
}

export function NotFoundView({
  homeHref = '/',
  homeLabel,
  title,
  description,
  compact = false,
  className,
}: NotFoundViewProps) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')
  const router = useRouter()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        compact ? 'py-8' : 'min-h-[50vh] py-12 sm:min-h-[60vh]',
        className
      )}
    >
      <p className="text-7xl font-bold tracking-tight text-[#0052ff]/15 sm:text-8xl">404</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
        {title ?? t('notFoundTitle')}
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 sm:text-base">
        {description ?? t('notFoundDescription')}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Home className="h-4 w-4" />
          {homeLabel ?? t('goHome')}
        </Link>
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
