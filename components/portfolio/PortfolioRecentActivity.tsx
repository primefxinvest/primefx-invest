'use client'

import { Link } from '@/i18n/navigation'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Gift } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { ListSkeleton } from '@/components/shared/skeletons'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useLiveTransactions } from '@/lib/hooks/useLiveTransactions'
import { fetchRecentTransactions } from '@/lib/data/queries'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const typeStyles: Record<
  string,
  { icon: typeof ArrowDownLeft; iconBg: string; iconColor: string }
> = {
  Deposit: { icon: ArrowDownLeft, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  Profit: { icon: ArrowUpRight, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  Withdraw: { icon: ArrowUpRight, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  Transfer: { icon: ArrowUpRight, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  Bonus: { icon: Gift, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
}

export default function PortfolioRecentActivity() {
  const user = useSessionUser()
  const { data: transactions, loading, error, reload } = useLiveTransactions(
    () => fetchRecentTransactions(6),
    { userId: user.id, variant: 'recent', limit: 6 }
  )

  return (
    <div className={cn(dashboardCardClass, 'flex h-full min-h-[280px] flex-col')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={dashboardSectionTitleClass}>Recent Portfolio Activity</h2>
        <Link
          href="/transactions"
          className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <AsyncState
        loading={loading && !transactions?.length}
        error={error}
        onRetry={reload}
        isEmpty={!transactions?.length}
        emptyTitle="No recent activity"
        emptyDescription="Portfolio transactions will appear here."
        emptyAction={
          <Link href="/wallet" className="text-sm font-semibold text-primary hover:underline">
            Go to wallet
          </Link>
        }
        skeleton={<ListSkeleton rows={4} />}
        compact
      >
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {transactions?.map((tx) => {
            const style = typeStyles[tx.type] ?? typeStyles.Deposit
            const Icon = style.icon
            const isPositive = tx.amount.startsWith('+')

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      style.iconBg
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', style.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
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
