'use client'

import { Crown, Sparkles, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import { cn } from '@/lib/utils'

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

type ReferralHeroSectionProps = {
  overview: ReferralProgramOverview
}

export function ReferralHeroSection({ overview }: ReferralHeroSectionProps) {
  const rank = overview.rank
  const isMaxRank = rank.current === rank.next
  const nextShort = shortRankName(rank.next)

  return (
    <section
      aria-label="Referral earnings overview"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="relative bg-gradient-to-br from-[#0052ff]/[0.06] via-white to-violet-50/40 px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#0052ff]/5 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0052ff]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0052ff]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Referral Center
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                Program Active
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              Grow your network. Earn with transparency.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Invite investors, earn one-time investment commissions, and receive weekly profit share
              across four network levels — with full visibility into every payout.
            </p>
          </div>

          <div className="grid w-full shrink-0 grid-cols-2 gap-3 sm:max-w-md lg:max-w-sm">
            <div className="rounded-xl border border-gray-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Lifetime earnings
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
                {formatCurrency(overview.lifetimeEarnings)}
              </p>
              {overview.trends.lifetime ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  {overview.trends.lifetime}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                This month
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">
                {formatCurrency(overview.thisMonthEarnings)}
              </p>
              {overview.trends.month ? (
                <p className="mt-1 text-xs font-semibold text-emerald-600">{overview.trends.month}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative mt-6 rounded-xl border border-gray-200/80 bg-white/95 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                <Crown className="h-6 w-6 text-violet-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Current rank</p>
                <p className="text-lg font-bold text-gray-900">{shortRankName(rank.current)}</p>
              </div>
            </div>
            <div className="min-w-0 flex-1 sm:max-w-md sm:px-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{isMaxRank ? 'Maximum rank achieved' : `Progress to ${nextShort}`}</span>
                <span className="tabular-nums font-semibold text-gray-900">
                  {rank.activeInvestors.toLocaleString()}
                  <span className="font-normal text-gray-400">
                    {' '}
                    / {rank.nextThreshold.toLocaleString()}
                  </span>
                </span>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-violet-100"
                role="progressbar"
                aria-label="Rank progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={rank.progressPercent}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-[#0052ff] transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(rank.progressPercent, rank.progressPercent > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              {!isMaxRank && rank.membersRemaining > 0 ? (
                <p className="mt-1.5 text-xs text-gray-500">
                  {rank.membersRemaining.toLocaleString()} more active member
                  {rank.membersRemaining === 1 ? '' : 's'} to unlock {nextShort}
                </p>
              ) : null}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-gray-500">Next reward</p>
              <p className="text-sm font-bold text-[#0052ff]">{isMaxRank ? 'Top tier' : nextShort}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
