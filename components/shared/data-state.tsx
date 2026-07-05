'use client'

import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { toUserFacingError } from '@/lib/errors/user-facing'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center',
        compact ? 'px-4 py-8' : 'px-6 py-12',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export function ErrorState({
  title,
  description,
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  const t = useTranslations('errors')
  const tCommon = useTranslations('common')
  const resolvedTitle = title ?? t('genericError')
  const resolvedDescription = toUserFacingError(description, t('loadErrorDescription'))

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-center',
        compact ? 'px-4 py-8' : 'px-6 py-12',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{resolvedTitle}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{resolvedDescription}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {tCommon('tryAgain')}
        </button>
      ) : null}
    </div>
  )
}

interface AsyncStateProps {
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  isEmpty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  skeleton?: React.ReactNode
  errorTitle?: string
  className?: string
  compact?: boolean
  children: React.ReactNode
}

export function AsyncState({
  loading,
  error,
  onRetry,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  skeleton,
  errorTitle,
  className,
  compact,
  children,
}: AsyncStateProps) {
  const t = useTranslations('errors')
  const resolvedEmptyTitle = emptyTitle ?? t('noDataYet')

  if (loading) {
    return <div className={className}>{skeleton}</div>
  }

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={error}
        onRetry={onRetry}
        className={className}
        compact={compact}
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={resolvedEmptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
        compact={compact}
      />
    )
  }

  return <>{children}</>
}
