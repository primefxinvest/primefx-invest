'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Gift } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { ListSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchRecentTransactions } from '@/lib/data/queries'
import { cn } from '@/lib/utils'

const typeKeys: Record<string, 'txDeposit' | 'txProfit' | 'txWithdraw' | 'txTransfer' | 'txBonus'> = {
  Deposit: 'txDeposit',
  Profit: 'txProfit',
  Withdraw: 'txWithdraw',
  Transfer: 'txTransfer',
  Bonus: 'txBonus',
}

const typeStyles: Record<
  string,
  { icon: typeof ArrowDownLeft; iconBg: string; iconColor: string }
> = {
  Deposit: {
    icon: ArrowDownLeft,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  Profit: {
    icon: ArrowUpRight,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  Withdraw: {
    icon: ArrowUpRight,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  Transfer: {
    icon: ArrowUpRight,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  Bonus: {
    icon: Gift,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
}

export default function DashboardRecentTransactions() {
  const t = useTranslations('dashboard')
  const { data: transactions, loading, error, reload } = useAsyncData(
    () => fetchRecentTransactions(4),
    []
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">{t('recentTransactions')}</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-0.5 text-xs font-semibold text-[#0052ff] hover:underline"
        >
          {t('viewAll')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!transactions?.length}
        emptyTitle={t('noTransactionsTitle')}
        emptyDescription={t('noTransactionsDesc')}
        emptyAction={
          <Link href="/wallet" className="text-sm font-semibold text-[#0052ff] hover:underline">
            {t('goToWallet')}
          </Link>
        }
        skeleton={<ListSkeleton rows={4} />}
        compact
      >
        <div className="space-y-2">
          {transactions?.map((tx) => {
            const style = typeStyles[tx.type] ?? typeStyles.Deposit
            const labelKey = typeKeys[tx.type] ?? 'txDeposit'
            const Icon = style.icon
            const isPositive = tx.amount.startsWith('+')

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full',
                      style.iconBg
                    )}
                  >
                    <Icon className={cn('h-4 w-4', style.iconColor)} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{t(labelKey)}</p>
                    <p className="text-[10px] text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-xs font-bold',
                      isPositive ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {tx.amount}
                  </p>
                  <p className="text-[10px] text-gray-400">{tx.status}</p>
                </div>
              </div>
            )
          })}
        </div>
      </AsyncState>
    </div>
  )
}
