'use client'

import { Briefcase, Crown, Gem, Layers, Sprout, TrendingUp } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { CapitalWithdrawButton } from '@/components/portfolio/CapitalWithdrawButton'
import type { CapitalWithdrawalRequestItem } from '@/lib/data/types'
import type { PortfolioInvestmentItem } from '@/lib/data/types'
import { dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

const planIcons: Record<string, typeof Layers> = {
  'Starter Plan': Sprout,
  'Growth Plan': TrendingUp,
  'Prime Plan': Crown,
  'Elite Plan': Gem,
}

interface ActiveInvestmentsTableProps {
  investments: PortfolioInvestmentItem[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  capitalWithdrawalByInvestment: Map<string, CapitalWithdrawalRequestItem>
  onWithdrawalRequested: () => void
  className?: string
}

export default function ActiveInvestmentsTable({
  investments,
  loading,
  error,
  onRetry,
  capitalWithdrawalByInvestment,
  onWithdrawalRequested,
  className,
}: ActiveInvestmentsTableProps) {
  return (
    <div className={cn('overflow-hidden p-0 sm:p-0', className)}>
      <div className="border-b border-border px-5 py-3.5">
        <h2 className={dashboardSectionTitleClass}>Active Investments</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Each position is independent — profits and returns are calculated separately.
        </p>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))
        ) : error ? (
          <p className="text-center text-sm text-red-600">
            {error}{' '}
            {onRetry ? (
              <button type="button" onClick={onRetry} className="font-semibold underline">
                Retry
              </button>
            ) : null}
          </p>
        ) : investments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No active investments yet.{' '}
            <Link href="/invest" className="font-medium text-primary hover:underline">
              Start investing
            </Link>
          </p>
        ) : (
          investments.map((inv) => (
            <InvestmentMobileCard
              key={inv.id}
              investment={inv}
              pendingRequest={capitalWithdrawalByInvestment.get(inv.id)}
              onWithdrawalRequested={onWithdrawalRequested}
            />
          ))
        )}
      </div>

      {/* Desktop table */}
      <ScrollTable className="hidden md:block">
        <table className="w-full min-w-[960px] text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3">Investment</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Weekly Return</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Next Payout</th>
              <th className="px-3 py-3">Profit</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-5 py-3">
                    <div className="h-10 animate-pulse rounded-md bg-gray-200/80" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-5 py-6 text-center text-sm text-red-600">
                  {error}
                </td>
              </tr>
            ) : investments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-[13px] text-muted-foreground">
                  No active investments yet.{' '}
                  <Link href="/invest" className="font-medium text-primary hover:underline">
                    Start investing
                  </Link>
                </td>
              </tr>
            ) : (
              investments.map((inv) => {
                const Icon = planIcons[inv.plan] ?? Layers
                return (
                  <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            inv.iconBg
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/portfolio/investments/${inv.id}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {inv.displayId}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">{inv.plan}</p>
                          <span
                            className={cn(
                              'mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                              inv.categoryColor
                            )}
                          >
                            {inv.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-foreground">{inv.invested}</td>
                    <td className="px-3 py-3.5 font-semibold text-emerald-600">{inv.weeklyReturn}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{inv.createdAt}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{inv.nextPayoutDate}</td>
                    <td className="px-3 py-3.5 font-semibold text-emerald-600">{inv.accumulatedProfit}</td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <CapitalWithdrawButton
                        investmentId={inv.id}
                        planName={inv.plan}
                        pendingRequest={capitalWithdrawalByInvestment.get(inv.id)}
                        isCapitalUnlocked={inv.isCapitalUnlocked}
                        lockCountdown={inv.lockCountdown}
                        capitalLockDays={inv.capitalLockDays}
                        onRequested={onWithdrawalRequested}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </ScrollTable>

      <div className="border-t border-border px-5 py-3">
        <Link
          href="/invest"
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          Add another investment
        </Link>
      </div>
    </div>
  )
}

function InvestmentMobileCard({
  investment,
  pendingRequest,
  onWithdrawalRequested,
}: {
  investment: PortfolioInvestmentItem
  pendingRequest?: CapitalWithdrawalRequestItem
  onWithdrawalRequested: () => void
}) {
  const Icon = planIcons[investment.plan] ?? Layers

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', investment.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/portfolio/investments/${investment.id}`}
              className="font-semibold text-foreground hover:text-primary hover:underline"
            >
              {investment.displayId}
            </Link>
            <p className="truncate text-sm text-muted-foreground">{investment.plan}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">{investment.weeklyReturn}</p>
          <p className="text-[10px] text-muted-foreground">weekly</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-semibold">{investment.invested}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Profit</dt>
          <dd className="font-semibold text-emerald-600">{investment.accumulatedProfit}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="font-semibold">{investment.createdAt}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Next payout</dt>
          <dd className="font-semibold">{investment.nextPayoutDate}</dd>
        </div>
      </dl>

      {investment.withdrawalHistory.length > 0 ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {investment.withdrawalHistory.length} withdrawal request
          {investment.withdrawalHistory.length !== 1 ? 's' : ''} on record
        </p>
      ) : null}

      <div className="mt-3">
        <CapitalWithdrawButton
          investmentId={investment.id}
          planName={investment.plan}
          pendingRequest={pendingRequest}
          isCapitalUnlocked={investment.isCapitalUnlocked}
          lockCountdown={investment.lockCountdown}
          capitalLockDays={investment.capitalLockDays}
          onRequested={onWithdrawalRequested}
        />
      </div>
    </article>
  )
}
