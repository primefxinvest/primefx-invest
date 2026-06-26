'use client'

import { Wallet, Clock, Gift } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletData } from '@/lib/data/queries'

export default function WalletBalanceCards() {
  const { data: wallet, loading, error, reload } = useAsyncData(() => fetchWalletData(), [])

  const balanceCards = [
    {
      label: 'Available Balance',
      value: wallet?.availableBalance ?? '$0.00',
      subtext: 'Available to use',
      subtextColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-500',
      icon: Wallet,
    },
    {
      label: 'Pending Balance',
      value: wallet?.pendingBalance ?? '$0.00',
      subtext: 'In processing',
      subtextColor: 'text-orange-500',
      iconBg: 'bg-orange-50 text-orange-500',
      icon: Clock,
    },
    {
      label: 'Bonus Balance',
      value: wallet?.bonusBalance ?? '$0.00',
      subtext: 'Bonus earnings',
      subtextColor: 'text-purple-500',
      iconBg: 'bg-purple-50 text-purple-500',
      icon: Gift,
    },
    {
      label: 'Total Balance',
      value: wallet?.totalBalance ?? '$0.00',
      subtext: 'Total funds',
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
      skeleton={<MetricCardsSkeleton />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {balanceCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className={`mt-1 text-xs font-medium ${card.subtextColor}`}>{card.subtext}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AsyncState>
  )
}
