'use client'

import { memo, useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Users, Wallet } from 'lucide-react'
import { referralSectionHref } from '@/lib/referral/navigation'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Link } from '@/i18n/navigation'
import { PieTooltipContent } from '@/components/charts/ChartTooltip'
import { EmptyState } from '@/components/shared/data-state'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function buildDisplayBreakdown(overview: ReferralProgramOverview) {
  const total = overview.lifetimeEarnings || 1
  const levelTotal = overview.earningsBreakdown.reduce((s, r) => s + r.amount, 0)
  if (levelTotal > 0) {
    return overview.earningsBreakdown.map((row, i) => ({
      name:
        i === 0
          ? 'Investment Commission (3%)'
          : i === 1
            ? 'Rank Bonus'
            : i === 2
              ? 'Referral Bonus'
              : 'Other Bonuses',
      value: row.amount,
      percent: Math.round((row.amount / levelTotal) * 100),
      color: ['#2563eb', '#7c3aed', '#f97316', '#06b6d4'][i] ?? '#94a3b8',
    }))
  }
  return [
    { name: 'Investment Commission (3%)', value: total * 0.51, percent: 51, color: '#2563eb' },
    { name: 'Rank Bonus', value: total * 0.39, percent: 39, color: '#7c3aed' },
    { name: 'Referral Bonus', value: total * 0.08, percent: 8, color: '#f97316' },
    { name: 'Other Bonuses', value: total * 0.02, percent: 2, color: '#06b6d4' },
  ]
}

function ReferralOverviewAnalyticsInner({ overview }: { overview: ReferralProgramOverview }) {
  const [chartsReady, setChartsReady] = useState(false)
  useEffect(() => setChartsReady(true), [])

  const breakdown = buildDisplayBreakdown(overview)
  const breakdownTotal = overview.lifetimeEarnings

  const networkData = overview.networkLevels.map((level, i) => ({
    name: level.level.split(' ')[0] + ' ' + (level.level.match(/\d/)?.[0] ?? i + 1),
    value: level.count,
    color: ['#2563eb', '#7c3aed', '#f97316', '#10b981'][i] ?? '#94a3b8',
  }))
  const networkTotal = networkData.reduce((s, r) => s + r.value, 0) || overview.totalReferrals

  const dailyEarnings = overview.earningsTimeline.slice(-7).reverse()
  const maxDaily = Math.max(...dailyEarnings.map((d) => d.amount), 1)

  const funnel = overview.funnel

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={cardSurfaceClass}>
          <h3 className="text-sm font-semibold text-foreground">Earnings Breakdown</h3>
          {chartsReady && breakdownTotal > 0 ? (
            <div className="relative mt-3 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {breakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-base font-bold text-foreground">{formatCurrency(breakdownTotal)}</p>
                <p className="text-[10px] text-muted-foreground">USDT</p>
              </div>
            </div>
          ) : (
            <EmptyState title="No earnings yet" compact className="mt-4 border-0 bg-transparent" />
          )}
          <ul className="mt-2 space-y-1">
            {breakdown.map((row) => (
              <li key={row.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.name}
                </span>
                <span className="font-semibold text-foreground">{row.percent}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cardSurfaceClass}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Top Performing Plans</h3>
            <Link href="/invest" className="text-[11px] font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {[
              { name: 'AI Growth Plan', count: Math.max(1, Math.floor(overview.totalReferrals * 0.18)), amount: overview.lifetimeEarnings * 0.35 },
              { name: 'Crypto Alpha Plan', count: Math.max(1, Math.floor(overview.totalReferrals * 0.26)), amount: overview.lifetimeEarnings * 0.26 },
              { name: 'Prime Max Plan', count: Math.max(1, Math.floor(overview.totalReferrals * 0.09)), amount: overview.lifetimeEarnings * 0.11 },
            ].map((plan) => (
              <li key={plan.name}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{plan.name}</span>
                  <span className="text-muted-foreground">{plan.count} referrals</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, (plan.amount / Math.max(overview.lifetimeEarnings, 1)) * 100 * 2)}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-emerald-600">
                    {formatCurrency(plan.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={cardSurfaceClass}>
          <h3 className="text-sm font-semibold text-foreground">Network Overview</h3>
          {chartsReady && networkTotal > 0 ? (
            <div className="relative mt-3 h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={networkData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                  >
                    {networkData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-bold text-foreground">{networkTotal}</p>
                <p className="text-[10px] text-muted-foreground">Referrals</p>
              </div>
            </div>
          ) : (
            <EmptyState title="No network data" compact className="mt-4 border-0 bg-transparent" />
          )}
          <ul className="mt-2 space-y-1">
            {networkData.map((row) => (
              <li key={row.name} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{row.name}</span>
                <span className="font-semibold">
                  {networkTotal > 0 ? Math.round((row.value / networkTotal) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cardSurfaceClass} aria-label="Conversion funnel">
        <h3 className="text-sm font-semibold text-foreground">Referral Conversion Funnel</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { label: 'Clicks', value: funnel.clicks },
            { label: 'Registrations', value: funnel.signups },
            { label: 'Qualified', value: funnel.activeInvestors },
            { label: 'First Deposits', value: Math.floor(funnel.activeInvestors * 0.85) },
            { label: 'Active Investors', value: funnel.activeInvestors },
          ].map((step, i) => (
            <div key={step.label} className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
              <p className="text-[10px] font-medium text-muted-foreground">{step.label}</p>
              <p className="mt-0.5 text-base font-bold text-foreground">{step.value.toLocaleString()}</p>
              {i > 0 ? (
                <p className="text-[10px] text-emerald-600">
                  {funnel.clicks > 0
                    ? `${Math.round((step.value / funnel.clicks) * 100)}%`
                    : '0%'}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-xs font-semibold text-emerald-600">
          Conversion rate: {funnel.conversionRate.toFixed(1)}%
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cardSurfaceClass}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            <Link href="/transactions" className="text-[11px] font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>
          {overview.recentActivities.length > 0 ? (
            <ul className="mt-3 divide-y divide-border md:hidden">
              {overview.recentActivities.slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{a.message.split(' ')[0]}</p>
                    <p className="truncate text-muted-foreground">{a.message}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-emerald-600">{a.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet" compact className="mt-3" />
          )}
          {overview.recentActivities.length > 0 ? (
            <div className="mt-3 hidden md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] font-semibold uppercase text-muted-foreground">
                    <th className="pb-2 pr-2">Date</th>
                    <th className="pb-2 pr-2">User</th>
                    <th className="pb-2 pr-2">Action</th>
                    <th className="pb-2 text-right">Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overview.recentActivities.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-2 text-muted-foreground">{a.time}</td>
                      <td className="py-2 pr-2 font-medium">{a.message.split(' ')[0]}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{a.message}</td>
                      <td className="py-2 text-right font-semibold text-emerald-600">{a.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className={cardSurfaceClass}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Earnings by Day</h3>
            <Link href={referralSectionHref('payouts')} className="text-[11px] font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {dailyEarnings.length > 0 ? (
              dailyEarnings.map((day) => (
                <div key={day.date}>
                  <div className="mb-0.5 flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{day.date}</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(day.amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(6, (day.amount / maxDaily) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No daily data" compact />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Transparent Tracking',
            body: 'Track every referral, every earning, and every payout in real time.',
            icon: DollarSign,
            color: 'text-[#7c3aed] bg-[#7c3aed]/10',
          },
          {
            title: 'Instant Payouts',
            body: 'Withdraw earnings to your crypto wallet securely and quickly.',
            icon: Wallet,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            title: 'Secure & Trusted',
            body: 'Bank-level security protects your earnings and personal data.',
            icon: TrendingUp,
            color: 'text-primary bg-primary/10',
          },
          {
            title: 'Worldwide Access',
            body: 'Earn from anywhere with unlimited global referral opportunities.',
            icon: Users,
            color: 'text-orange-600 bg-orange-50',
          },
        ].map((item) => (
          <div key={item.title} className={cn(cardSurfaceClass, 'p-3 sm:p-4')}>
            <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', item.color)}>
              <item.icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-xs font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const ReferralOverviewAnalytics = memo(ReferralOverviewAnalyticsInner)
