'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Gift } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { ListSkeleton } from '@/components/shared/skeletons'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useLiveTransactions } from '@/lib/hooks/useLiveTransactions'
import { fetchRecentTransactions } from '@/lib/data/queries'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
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
  const user = useSessionUser()
  const { data: transactions, loading, error, reload } = useLiveTransactions(
    () => fetchRecentTransactions(4),
    { userId: user.id, variant: 'recent', limit: 4 }
  )

  return (
    <div className={dashboardCardClass}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={dashboardSectionTitleClass}>{t('recentTransactions')}</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
        >
          {t('viewAll')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

          <AsyncState
            loading={loading && !transactions?.length}
            error={error}
            onRetry={reload}
            isEmpty={!transactions?.length}
        emptyTitle={t('noTransactionsTitle')}
        emptyDescription={t('noTransactionsDesc')}
        emptyAction={
          <Link href="/wallet" className="text-sm font-semibold text-primary hover:underline">
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
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      style.iconBg
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', style.iconColor)} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t(labelKey)}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.date}</p>
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
                  <p className="text-[10px] text-muted-foreground">{tx.status}</p>
                </div>
              </div>
            )
          })}
        </div>
      </AsyncState>
    </div>
  )
}
