'use client'

import { useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { ChartCardSkeleton } from '@/components/shared/skeletons'
import MarketOverviewWidget from '@/components/dashboard/MarketOverviewWidget'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchMarketOverview } from '@/lib/data/queries'

const CACHE_OPTS = { cacheKey: 'dashboard-market-overview', cacheTtlMs: 30_000 } as const

export default function DashboardMarketSection() {
  const t = useTranslations('dashboard')
  const { data: markets, loading, error, reload } = useAsyncData(
    () => fetchMarketOverview(),
    [],
    undefined,
    CACHE_OPTS
  )

  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={reload}
      isEmpty={!markets?.length}
      emptyTitle={t('noMarketTitle')}
      emptyDescription={t('noMarketDesc')}
      skeleton={<ChartCardSkeleton height="h-48" />}
      compact
    >
      <MarketOverviewWidget markets={markets ?? []} />
    </AsyncState>
  )
}
