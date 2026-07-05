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
import { MotionCard, StaggerContainer, StaggerItem } from '@/lib/motion'
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
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  Profit: {
    icon: ArrowUpRight,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  Withdraw: {
    icon: ArrowUpRight,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  Transfer: {
    icon: ArrowUpRight,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  Bonus: {
    icon: Gift,
    iconBg: 'bg-orange-50',
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
    <MotionCard className={dashboardCardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={dashboardSectionTitleClass}>{t('recentTransactions')}</h2>
        <Link
          href="/transactions"
          className="inline-flex min-h-11 items-center gap-0.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg px-1"
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
          <Link
            href="/wallet"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
          >
            {t('goToWallet')}
          </Link>
        }
        skeleton={<ListSkeleton rows={4} />}
        compact
      >
        <StaggerContainer as="ul" className="divide-y divide-border" aria-label={t('recentTransactions')}>
          {transactions?.map((tx) => {
            const style = typeStyles[tx.type] ?? typeStyles.Deposit
            const labelKey = typeKeys[tx.type] ?? 'txDeposit'
            const Icon = style.icon
            const isPositive = tx.amount.startsWith('+')

            return (
              <StaggerItem key={tx.id} as="li">
                <div className="flex min-h-[3.25rem] items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        style.iconBg
                      )}
                    >
                      <Icon className={cn('h-4 w-4', style.iconColor)} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{t(labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.status}</p>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </AsyncState>
    </MotionCard>
  )
}
