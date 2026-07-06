'use client'

import { useMemo } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ArrowLeft, Calendar, Clock, Lock, TrendingUp, Wallet } from 'lucide-react'
import { CapitalWithdrawButton } from '@/components/portfolio/CapitalWithdrawButton'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useInvestmentProfitRealtime } from '@/lib/hooks/useInvestmentProfitRealtime'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import {
  fetchCapitalWithdrawalRequests,
  fetchInvestmentDetail,
} from '@/lib/data/queries'
import { formatCurrency, formatDateTime } from '@/lib/data/format'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

export function InvestmentDetailView({ investmentId }: { investmentId: string }) {
  const router = useRouter()
  const user = useSessionUser()

  const { data, loading, error, reload } = useAsyncData(
    () => fetchInvestmentDetail(investmentId),
    [investmentId]
  )

  const { data: capitalWithdrawals = [], reload: reloadWithdrawals } = useAsyncData(
    () => fetchCapitalWithdrawalRequests(),
    []
  )

  const pendingRequest = useMemo(
    () => capitalWithdrawals.find((r) => r.investmentId === investmentId),
    [capitalWithdrawals, investmentId]
  )

  useInvestmentProfitRealtime({
    userId: user.id,
    investmentId,
    enabled: Boolean(user.id),
    onChange: () => {
      void reload()
    },
  })

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={cn(dashboardCardClass, 'p-6 text-center')}>
        <p className="text-sm text-destructive">{error ?? 'Investment not found.'}</p>
        <button
          type="button"
          onClick={() => router.push('/portfolio')}
          className="mt-4 text-sm font-semibold text-primary hover:underline"
        >
          Back to portfolio
        </button>
      </div>
    )
  }

  const lockActive = !data.isCapitalUnlocked && data.capitalLockDays > 0

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/portfolio')}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portfolio
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {data.category}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {data.displayId} · {data.plan}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {data.createdAt} · {data.status}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {data.status}
        </span>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Investment amount', value: formatCurrency(data.investedAmount), icon: Wallet },
          { label: 'Total earned', value: formatCurrency(data.totalEarned), icon: TrendingUp },
          { label: 'ROI', value: data.roi, icon: TrendingUp },
          { label: 'Daily profit', value: formatCurrency(data.dailyProfit), icon: Clock },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className={cn(dashboardCardClass, 'p-4')}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="mt-2 text-xl font-bold text-foreground">{item.value}</p>
            </div>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={cn(dashboardCardClass, 'space-y-4 p-5 lg:col-span-2')}>
          <h2 className={dashboardSectionTitleClass}>Performance</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Weekly return</dt>
              <dd className="text-sm font-semibold text-foreground">{data.weeklyReturn}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Daily return</dt>
              <dd className="text-sm font-semibold text-foreground">{data.dailyReturn}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Current value</dt>
              <dd className="text-sm font-semibold text-foreground">
                {formatCurrency(data.currentValue)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Next payout</dt>
              <dd className="text-sm font-semibold text-foreground">{data.nextPayoutLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Compound mode</dt>
              <dd className="text-sm font-semibold text-foreground">
                {data.compoundMode ? 'Enabled' : 'Disabled'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Accumulated profit</dt>
              <dd className="text-sm font-semibold text-emerald-600">
                {formatCurrency(data.accumulatedProfit)}
              </dd>
            </div>
          </dl>
        </div>

        <div className={cn(dashboardCardClass, 'space-y-4 p-5')}>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className={dashboardSectionTitleClass}>Withdrawal unlock</h2>
          </div>

          {lockActive ? (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Investment progress</span>
                  <span className="font-semibold text-foreground">{data.lockProgressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${data.lockProgressPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.lockDaysRemaining} day{data.lockDaysRemaining === 1 ? '' : 's'} remaining
                until withdrawal unlock
              </p>
              <p className="text-xs font-medium text-amber-700">
                Available in: {data.lockCountdown}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-emerald-700">
              Capital withdrawal is unlocked for this investment.
            </p>
          )}

          <div className="border-t border-border pt-4">
            <CapitalWithdrawButton
              investmentId={data.id}
              planName={data.plan}
              pendingRequest={pendingRequest}
              isCapitalUnlocked={data.isCapitalUnlocked}
              lockCountdown={data.lockCountdown}
              capitalLockDays={data.capitalLockDays}
              onRequested={reloadWithdrawals}
            />
          </div>
        </div>
      </section>

      <section className={cn(dashboardCardClass, 'overflow-hidden p-0')}>
        <div className="border-b border-border px-5 py-3.5">
          <h2 className={dashboardSectionTitleClass}>Payout history</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Daily profits credited automatically to your wallet.
          </p>
        </div>
        {data.profitHistory.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No payouts yet. Your first daily profit will appear after the next settlement.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.profitHistory.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      +{formatCurrency(row.amountUsd)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.periodDate} · {data.plan} daily profit
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(row.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
