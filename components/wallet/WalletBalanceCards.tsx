'use client'

import { useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { InvestorKpiCards } from '@/components/shared/kpi'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useUserWalletRealtime } from '@/lib/hooks/useTransactionsRealtime'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { fetchPortfolioMetrics, fetchWalletData } from '@/lib/data/queries'
import { CACHE_KEYS } from '@/lib/data/cache-keys'

const CACHE_OPTS = { cacheTtlMs: 30_000 } as const

export default function WalletBalanceCards() {
  const t = useTranslations('wallet.overview')
  const user = useSessionUser()

  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    reload: reloadMetrics,
  } = useAsyncData(() => fetchPortfolioMetrics(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: CACHE_KEYS.portfolioMetrics,
  })

  const {
    data: wallet,
    loading: walletLoading,
    error: walletError,
    reload: reloadWallet,
  } = useAsyncData(() => fetchWalletData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: CACHE_KEYS.walletData,
  })

  useUserWalletRealtime({
    userId: user.id,
    enabled: Boolean(user.id),
    onUpdate: () => {
      void reloadWallet({ silent: true })
      void reloadMetrics({ silent: true })
    },
  })

  return (
    <AsyncState
      loading={metricsLoading || walletLoading}
      error={metricsError ?? walletError}
      onRetry={() => {
        void reloadMetrics()
        void reloadWallet()
      }}
      errorTitle={t('title')}
      skeleton={<MetricCardsSkeleton count={4} />}
    >
      <InvestorKpiCards variant="wallet" metrics={metrics} wallet={wallet} />
    </AsyncState>
  )
}
