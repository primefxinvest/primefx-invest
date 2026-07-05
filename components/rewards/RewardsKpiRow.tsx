'use client'

import { memo } from 'react'
import { Link } from '@/i18n/navigation'
import { ArrowUpRight, Gift, TrendingUp, Wallet } from 'lucide-react'
import {
  ReferralRankShield,
  shortRankName,
} from '@/components/referral/shared/referral-rank-ui'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { cn } from '@/lib/utils'

export type RewardsKpiData = {
  totalEarned: string
  available: string
  pending: string
  completedAchievements: number
  totalAchievements: number
  trend?: string
}

function RewardsKpiRowInner({ data }: { data: RewardsKpiData }) {
  return (
    <KpiGrid count={4} aria-label="Rewards key metrics">
      <KpiCard
        label="Total Rewards Earned"
        value={data.totalEarned}
        trend={data.trend ?? '+0%'}
        trendSuffix="vs last 7 days"
        icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-[#7c3aed]/10 text-[#7c3aed]"
      />
      <KpiCard
        label="Available Rewards"
        value={data.available}
        caption="Withdrawable balance"
        icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-primary/10 text-primary"
        href="/wallet/withdraw"
      />
      <KpiCard
        label="Pending Rewards"
        value={data.pending}
        caption="Processing"
        icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-orange-50 text-orange-600"
      />
      <KpiCard
        label="Completed Achievements"
        value={String(data.completedAchievements)}
        caption={`${data.totalAchievements - data.completedAchievements} in progress`}
        icon={<ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />}
        iconBg="bg-emerald-50 text-emerald-600"
      />
    </KpiGrid>
  )
}

export const RewardsKpiRow = memo(RewardsKpiRowInner)

export type RewardsHeroData = {
  rankName: string
  nextRankName: string
  progressPercent: number
  overallProgress: number
  totalEarned: string
  available: string
  pending: string
  completedCount: number
  estimatedWeeksToNext?: number
}

function RewardsHeroSectionInner({ data }: { data: RewardsHeroData }) {
  return (
    <section
      aria-label="Rewards center hero"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 p-5 shadow-xl sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#7c3aed]/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Rewards Center
        </p>
        <p className="mt-2 text-lg font-semibold text-white sm:text-xl">
          Complete achievements, grow your network, unlock exclusive rewards.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Earned', value: data.totalEarned },
            { label: 'Available', value: data.available },
            { label: 'Pending', value: data.pending },
            { label: 'Achievements', value: String(data.completedCount) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-bold text-white sm:text-base">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center sm:mx-0"
              role="progressbar"
              aria-valuenow={data.overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${data.overallProgress * 2.64} 264`}
                />
              </svg>
              <span className="absolute text-lg font-bold text-white">{data.overallProgress}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                Progress to {shortRankName(data.nextRankName)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-primary"
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {data.estimatedWeeksToNext
                  ? `Est. ${data.estimatedWeeksToNext} weeks to next rank at current pace`
                  : 'Keep growing your active network to reach the next rank'}
              </p>
              <Link
                href="/referral?section=benefits"
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#f97316] px-5 text-sm font-semibold text-white"
              >
                View Rank Benefits
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">Current Rank</p>
        <div className="mt-3 flex items-center gap-3">
          <ReferralRankShield rankName={data.rankName} size="md" />
          <div>
            <p className="text-xl font-bold text-foreground">{shortRankName(data.rankName)}</p>
            <p className="text-xs text-emerald-600 font-semibold">Top {Math.max(5, 100 - data.progressPercent)}%</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>To {shortRankName(data.nextRankName)}</span>
            <span className="font-semibold text-foreground">{data.progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#f97316]"
              style={{ width: `${data.progressPercent}%` }}
            />
          </div>
        </div>
        <Link
          href="/referral?section=rank"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold hover:bg-muted"
        >
          View My Rank
        </Link>
      </div>
    </section>
  )
}

export const RewardsHeroSection = memo(RewardsHeroSectionInner)
