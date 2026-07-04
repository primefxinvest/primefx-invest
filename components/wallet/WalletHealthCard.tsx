'use client'

import { Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletHealth } from '@/lib/data/queries'
import { ErrorState } from '@/components/shared/data-state'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const statusColors = {
  excellent: { stroke: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700' },
  good: { stroke: '#22c55e', text: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700' },
  fair: { stroke: '#f59e0b', text: 'text-amber-600', bg: 'bg-amber-100 text-amber-700' },
  actionRequired: { stroke: '#ef4444', text: 'text-red-600', bg: 'bg-red-100 text-red-700' },
}

export default function WalletHealthCard() {
  const t = useTranslations('wallet.health')
  const { data: health, loading, error, reload } = useAsyncData(() => fetchWalletHealth(), [], undefined, {
    timeoutMs: 20_000,
  })

  if (loading) {
    return (
      <div className={cn('flex h-full flex-col', dashboardCardClass)}>
        <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-3">
          <div className="h-28 w-28 animate-pulse rounded-full bg-gray-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('h-full', dashboardCardClass)}>
        <ErrorState compact title={t('title')} description={error} onRetry={reload} />
      </div>
    )
  }

  const score = (health?.score ?? 0) / 100
  const statusKey = health?.statusKey ?? 'actionRequired'
  const colors = statusColors[statusKey]

  return (
    <div className={cn('flex h-full flex-col', dashboardCardClass)}>
      <h2 className="text-sm font-bold text-foreground">{t('title')}</h2>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="#ecfdf5" strokeWidth="8" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke={colors.stroke}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 48}`}
              strokeDashoffset={`${2 * Math.PI * 48 * (1 - score)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Shield className="h-7 w-7 text-emerald-500" />
          </div>
        </div>

        <p className={`mt-4 text-sm font-semibold ${colors.text}`}>{t(statusKey)}</p>
        <p className="mt-1 text-center text-xs text-gray-500">{t('encryption')}</p>

        <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors.bg}`}>
          {statusKey === 'actionRequired' ? t('completeKyc') : t('allNormal')}
        </span>
      </div>
    </div>
  )
}
