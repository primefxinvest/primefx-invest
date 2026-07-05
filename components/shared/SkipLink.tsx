'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type SkipLinkProps = {
  href?: string
  className?: string
}

export function SkipLink({ href = '#main-content', className }: SkipLinkProps) {
  const t = useTranslations('common')

  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
        'focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
    >
      {t('skipToMainContent')}
    </a>
  )
}
