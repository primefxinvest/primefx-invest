'use client'

import { memo } from 'react'
import { ArrowRight, ExternalLink, Shield, Wallet } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { sectionStackClass } from '@/lib/layout/spacing'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import { cn } from '@/lib/utils'

type ReferralPayoutsSectionProps = {
  overview: ReferralProgramOverview
}

function ReferralPayoutsSectionInner({ overview }: ReferralPayoutsSectionProps) {
  const available = overview.lifetimeEarnings
  const withdrawn = Math.max(0, overview.lifetimeEarnings - overview.pendingCommissionUsd)
  const pending = overview.pendingCommissionUsd

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<Wallet className="h-5 w-5" aria-hidden />}
        title="Referral Payouts"
        subtitle="Withdraw your referral earnings securely using crypto only."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/transactions"
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"
            >
              Payout History
            </Link>
            <Link
              href="/settings"
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted"
            >
              Payout Settings
            </Link>
          </div>
        }
      />

      <KpiGrid count={4} aria-label="Payout summary">
        <KpiCard
          label="Available Balance"
          value={`${formatCurrency(available)} USDT`}
          caption="Ready to withdraw"
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-violet-50 text-violet-600"
          href="/wallet/withdraw"
        />
        <KpiCard
          label="Total Earned"
          value={`${formatCurrency(overview.lifetimeEarnings)} USDT`}
          caption="All time referral earnings"
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Total Withdrawn"
          value={`${formatCurrency(withdrawn)} USDT`}
          caption="Total amount withdrawn"
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-blue-50 text-primary"
          href="/transactions"
        />
        <KpiCard
          label="Pending Payouts"
          value={`${formatCurrency(pending)} USDT`}
          caption={pending > 0 ? 'Processing' : 'No pending payouts'}
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-orange-50 text-orange-600"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className={cardSurfaceClass}>
            <h2 className="font-semibold text-foreground">Withdraw Crypto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete withdrawals on the Wallet page with USDT, USDC, BTC and more via secure
              crypto rails.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['USDT TRC20', 'USDT ERC20', 'USDC', 'BTC'].map((option) => (
                <div
                  key={option}
                  className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center first:border-primary first:ring-2 first:ring-primary/20"
                >
                  <p className="text-xs font-semibold text-foreground">{option}</p>
                </div>
              ))}
            </div>
            <Link
              href="/wallet/withdraw"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-sm font-semibold text-white sm:w-auto sm:px-8"
            >
              Withdraw Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Withdrawal limit: 50.00 – 100,000.00 USDT · Network fee applies
            </p>
          </div>

          <div className={cardSurfaceClass}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Payouts</h3>
              <Link href="/transactions" className="text-sm font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>
            {overview.recentActivities.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {overview.recentActivities.slice(0, 5).map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 pr-4 text-muted-foreground">{row.time}</td>
                        <td className="py-3 pr-4 font-semibold text-emerald-600">{row.amount}</td>
                        <td className="py-3 pr-4 text-muted-foreground">Referral commission</td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No payouts yet. Earnings appear here once commissions are paid.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-violet-200">Payout Balance</p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(available)} USDT</p>
            <p className="mt-1 text-xs text-violet-200">Minimum withdrawal: 50 USDT</p>
            <Link
              href="/wallet/withdraw"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-white/15 text-sm font-semibold hover:bg-white/25"
            >
              Withdraw Now
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Earnings Summary</h3>
            <p className="text-xs text-muted-foreground">This Month</p>
            <ul className="mt-3 space-y-2 text-sm">
              {overview.earningsBreakdown.map((item) => (
                <li key={item.name} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold text-emerald-600">
                    +{formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-sm font-bold text-emerald-600">
              Total: +{formatCurrency(overview.thisMonthEarnings)}
            </p>
          </div>

          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">How It Works</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Earn referral commissions from your network</li>
              <li>2. Accumulate earnings in your wallet balance</li>
              <li>3. Withdraw instantly to your crypto wallet</li>
            </ol>
          </div>

          <div className={cardSurfaceClass}>
            <Shield className="h-8 w-8 text-primary" aria-hidden />
            <p className="mt-2 font-semibold text-foreground">Secure & Fast</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Encrypted payout processing</li>
              <li>Instant crypto withdrawals</li>
              <li>Full transaction transparency</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export const ReferralPayoutsSection = memo(ReferralPayoutsSectionInner)
