'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Gift, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AsyncState } from '@/components/shared/data-state'
import { StatusCardGrid } from '@/components/shared/status-cards'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletActivitySummary } from '@/lib/data/queries'
import { cn } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/custom-select'

const periodKeys = ['periodThisMonth', 'periodLastMonth', 'periodThisYear'] as const

const itemKeys = [
  { key: 'deposits' as const, labelKey: 'deposits', icon: ArrowDownLeft, iconBg: 'bg-emerald-50 text-emerald-500', trendColor: 'text-emerald-500' },
  { key: 'withdrawals' as const, labelKey: 'withdrawals', icon: ArrowUpRight, iconBg: 'bg-red-50 text-red-500', trendColor: 'text-red-500' },
  { key: 'transfers' as const, labelKey: 'transfers', icon: Send, iconBg: 'bg-blue-50 text-[#0052ff]', trendColor: 'text-[#0052ff]' },
  { key: 'bonuses' as const, labelKey: 'bonuses', icon: Gift, iconBg: 'bg-purple-50 text-purple-500', trendColor: 'text-purple-500' },
]

export default function WalletActivitySummary() {
  const t = useTranslations('wallet.activity')
  const { data: summary, loading, error, reload } = useAsyncData(
    () => fetchWalletActivitySummary(),
    []
  )
  const [period, setPeriod] = useState<string>(periodKeys[0])

  const periodOptions = periodKeys.map((key) => ({
    value: key,
    label: t(key),
  }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">{t('title')}</h2>
        <CustomSelect
          value={period}
          onValueChange={setPeriod}
          size="sm"
          className="min-w-0 w-auto"
          triggerClassName="border-0 bg-transparent px-1 shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 text-gray-600 font-medium"
          options={periodOptions}
          placeholder={t('period')}
        />
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        errorTitle={t('loadError')}
        skeleton={<MetricCardsSkeleton count={4} />}
        compact
      >
        <StatusCardGrid columns={4}>
          {itemKeys.map((item) => {
            const Icon = item.icon
            const data = summary?.[item.key]

            return (
              <div
                key={item.key}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-gray-500 sm:text-xs">{t(item.labelKey)}</p>
                    <p className="mt-1 text-base font-bold text-gray-900 sm:text-lg">{data?.value ?? '$0.00'}</p>
                    <p className={cn('mt-0.5 text-[10px] font-semibold sm:text-[11px]', item.trendColor)}>
                      {data?.change ?? '0%'}{' '}
                      <span className="font-normal text-gray-400">{t('vsLastMonth')}</span>
                    </p>
                  </div>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9', item.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </StatusCardGrid>
      </AsyncState>
    </div>
  )
}
