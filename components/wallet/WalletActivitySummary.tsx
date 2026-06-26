'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Gift, Send } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletActivitySummary } from '@/lib/data/queries'
import { cn } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/custom-select'

const periods = ['This Month', 'Last Month', 'This Year']

const items = [
  {
    key: 'deposits' as const,
    label: 'Total Deposits',
    icon: ArrowDownLeft,
    iconBg: 'bg-emerald-50 text-emerald-500',
    trendColor: 'text-emerald-500',
  },
  {
    key: 'withdrawals' as const,
    label: 'Total Withdrawals',
    icon: ArrowUpRight,
    iconBg: 'bg-red-50 text-red-500',
    trendColor: 'text-red-500',
  },
  {
    key: 'transfers' as const,
    label: 'Total Transfers',
    icon: Send,
    iconBg: 'bg-blue-50 text-[#0052ff]',
    trendColor: 'text-[#0052ff]',
  },
  {
    key: 'bonuses' as const,
    label: 'Total Bonuses',
    icon: Gift,
    iconBg: 'bg-purple-50 text-purple-500',
    trendColor: 'text-purple-500',
  },
]

export default function WalletActivitySummary() {
  const { data: summary, loading, error, reload } = useAsyncData(
    () => fetchWalletActivitySummary(),
    []
  )
  const [period, setPeriod] = useState('This Month')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Recent Activity Summary</h2>
        <CustomSelect
          value={period}
          onValueChange={setPeriod}
          size="sm"
          className="min-w-[8rem]"
          options={periods.map((p) => ({ value: p, label: p }))}
          placeholder="Period"
        />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<MetricCardsSkeleton count={4} />}
        compact
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon
            const data = summary?.[item.key]

            return (
              <div
                key={item.key}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{data?.value ?? '$0.00'}</p>
                    <p className={cn('mt-1 text-[11px] font-semibold', item.trendColor)}>
                      {data?.change ?? '0%'}{' '}
                      <span className="font-normal text-gray-400">vs last month</span>
                    </p>
                  </div>
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </AsyncState>
    </div>
  )
}
