'use client'

import { Wallet, Clock, Gift } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { StatusCardGrid, statusCardSurfaceClass } from '@/components/shared/status-cards'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletData } from '@/lib/data/queries'

export default function WalletBalanceCards() {
  const t = useTranslations('wallet.balances')
  const { data: wallet, loading, error, reload } = useAsyncData(() => fetchWalletData(), [], undefined, {
    cacheKey: 'wallet-data',
  })

  const balanceCards = [
    {
      label: t('available'),
      value: wallet?.availableBalance ?? '$0.00',
      subtext: t('availableSub'),
      subtextColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-500',
      icon: Wallet,
    },
    {
      label: t('pending'),
      value: wallet?.pendingBalance ?? '$0.00',
      subtext: t('pendingSub'),
      subtextColor: 'text-orange-500',
      iconBg: 'bg-orange-50 text-orange-500',
      icon: Clock,
    },
    {
      label: t('bonus'),
      value: wallet?.bonusBalance ?? '$0.00',
      subtext: t('bonusSub'),
      subtextColor: 'text-purple-500',
      iconBg: 'bg-purple-50 text-purple-500',
      icon: Gift,
    },
    {
      label: t('total'),
      value: wallet?.totalBalance ?? '$0.00',
      subtext: t('totalSub'),
      subtextColor: 'text-[#0052ff]',
      iconBg: 'bg-blue-50 text-[#0052ff]',
      icon: Wallet,
    },
  ]

  return (
    <AsyncState
      loading={loading}
      error={error}
      onRetry={reload}
      errorTitle={t('loadError')}
      skeleton={<MetricCardsSkeleton />}
    >
      <StatusCardGrid columns={4}>
        {balanceCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={statusCardSurfaceClass}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-gray-500 sm:text-sm">{card.label}</p>
                  <p className="mt-1 text-lg font-bold text-gray-900 sm:text-2xl">{card.value}</p>
                  <p className={`mt-0.5 text-[10px] font-medium sm:text-xs ${card.subtextColor}`}>
                    {card.subtext}
                  </p>
                </div>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${card.iconBg}`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </StatusCardGrid>
    </AsyncState>
  )
}
