'use client'

import { memo } from 'react'
import {
  Award,
  BarChart3,
  Crown,
  Info,
  Lightbulb,
  Lock,
  Medal,
  TrendingUp,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import {
  ReferralRankShield,
  shortRankName,
} from '@/components/referral/shared/referral-rank-ui'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { sectionStackClass } from '@/lib/layout/spacing'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import { REFERRAL_RANK_TIERS } from '@/lib/referral/program-config'
import { referralSectionHref } from '@/lib/referral/navigation'
import { cn } from '@/lib/utils'

type ReferralMyRankSectionProps = {
  overview: ReferralProgramOverview
}

function ReferralMyRankSectionInner({ overview }: ReferralMyRankSectionProps) {
  const { rank } = overview
  const currentShort = shortRankName(rank.current)
  const nextShort = shortRankName(rank.next)
  const isMaxRank = rank.current === rank.next

  const currentTier = REFERRAL_RANK_TIERS.find((t) => t.name === rank.current)
  const nextTier = REFERRAL_RANK_TIERS.find((t) => t.name === rank.next)

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<Crown className="h-5 w-5 text-amber-500" aria-hidden />}
        title="My Rank"
        subtitle="Track your rank progress, team growth, and weekly commission distribution."
        action={
          <Link
            href={referralSectionHref('benefits')}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <Info className="h-4 w-4" />
            How Rank System Works
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 text-white shadow-lg">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex items-start gap-4">
                  <ReferralRankShield rankName={rank.current} size="lg" />
                  <div>
                    <p className="text-2xl font-bold text-orange-400">{currentShort}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Keep growing! You&apos;re on your way to the next rank.
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active Investors
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {rank.activeInvestors.toLocaleString()}
                      <span className="text-slate-400"> / {rank.nextThreshold.toLocaleString()}</span>
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${rank.progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{rank.progressPercent}% of requirement</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Team Volume
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatCurrency(overview.teamVolumeUsd)}
                      <span className="text-slate-400">
                        {' '}
                        / {formatCurrency(overview.rank.nextThreshold * 250)}
                      </span>
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${Math.min(100, rank.progressPercent + 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-700 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    Next Rank: <strong className="text-white">{nextShort}</strong>
                  </span>
                  <span className="font-bold text-orange-400">{rank.progressPercent}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                    style={{ width: `${rank.progressPercent}%` }}
                  />
                </div>
                {!isMaxRank ? (
                  <p className="mt-2 text-xs text-slate-400">
                    You need {rank.membersRemaining.toLocaleString()} more active investors to reach{' '}
                    {nextShort}.
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex gap-3 rounded-xl bg-slate-800/80 p-3">
                <Lightbulb className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
                <p className="text-xs leading-relaxed text-slate-300">
                  Tip: Invite more active investors and increase team volume to unlock higher ranks
                  and bigger rewards.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">
                  Weekly Earnings
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-3xl font-bold">{formatCurrency(overview.thisWeekEarnings)}</p>
                  {overview.trends.week ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                      {overview.trends.week}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-violet-200">From team profit share</p>
              </div>
              <div className="mt-4 space-y-2 border-t border-white/20 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-violet-200">This Week Profit Share</span>
                  <span className="font-semibold">{formatCurrency(overview.thisWeekEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-violet-200">Total Profit Share Earned</span>
                  <span className="font-semibold">{formatCurrency(overview.lifetimeEarnings)}</span>
                </div>
              </div>
              <Link
                href={referralSectionHref('payouts')}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/15 text-sm font-semibold backdrop-blur hover:bg-white/25"
              >
                <BarChart3 className="h-4 w-4" />
                View Earnings History
              </Link>
            </div>
          </div>

          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Rank Tiers</h2>
                <p className="text-sm text-muted-foreground">
                  Climb the ranks and unlock bigger rewards.
                </p>
              </div>
              <Link
                href={referralSectionHref('benefits')}
                className="inline-flex min-h-11 items-center rounded-xl border border-primary/30 px-4 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                View All Benefits
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Rank</th>
                    <th className="pb-3 pr-4">Active Investors</th>
                    <th className="pb-3 pr-4">Rank Bonus</th>
                    <th className="pb-3 pr-4">Weekly Profit Share</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {REFERRAL_RANK_TIERS.map((tier) => {
                    const unlocked = rank.activeInvestors >= tier.minMembers
                    const isCurrent = tier.name === rank.current
                    const isNext = tier.name === rank.next && !isMaxRank
                    return (
                      <tr key={tier.key} className={isCurrent ? 'bg-primary/5' : undefined}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <ReferralRankShield rankName={tier.name} size="sm" />
                            <span className="font-medium">{shortRankName(tier.name)}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{tier.minMembers.toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          {tier.cashBonusUsd > 0
                            ? `$${tier.cashBonusUsd.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="py-3 pr-4">Team profits</td>
                        <td className="py-3 text-right">
                          {isCurrent ? (
                            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                              Current
                            </span>
                          ) : isNext ? (
                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                              Next Rank
                            </span>
                          ) : unlocked ? (
                            <Medal className="inline h-4 w-4 text-emerald-600" aria-label="Achieved" />
                          ) : (
                            <Lock className="inline h-4 w-4 text-muted-foreground" aria-label="Locked" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Active Investors',
                body: 'Investors with active investments and valid KYC.',
                icon: TrendingUp,
                color: 'bg-blue-50 text-primary',
              },
              {
                title: 'Team Volume',
                body: 'Total investment amount from your active team.',
                icon: BarChart3,
                color: 'bg-violet-50 text-violet-600',
              },
              {
                title: 'Profit Share',
                body: 'Earn weekly from the profits generated by your team.',
                icon: Award,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                title: 'Fair & Transparent',
                body: 'Rewards are based on real activity and verified data.',
                icon: Medal,
                color: 'bg-orange-50 text-orange-600',
              },
            ].map((card) => (
              <div key={card.title} className={cardSurfaceClass}>
                <div
                  className={cn(
                    'mb-3 flex h-9 w-9 items-center justify-center rounded-full',
                    card.color
                  )}
                >
                  <card.icon className="h-4 w-4" aria-hidden />
                </div>
                <p className="font-semibold text-foreground">{card.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Your Rank Benefits</h3>
            <p className="text-xs text-muted-foreground">{currentShort} Benefits</p>
            <ul className="mt-4 space-y-3">
              {[
                `${currentShort} Rank Badge`,
                'Leaderboard Access',
                'Priority Email Support',
                'Monthly Rank Updates',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Award className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={referralSectionHref('benefits')}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-700 hover:bg-orange-100"
            >
              View All Benefits
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-muted/40 p-5">
            <p className="font-semibold text-foreground">Top Performers</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Top 10 performers this month may qualify for rank achievement rewards.
            </p>
            <Link
              href={referralSectionHref('leaderboard')}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View Leaderboard →
            </Link>
          </div>

          {!isMaxRank && nextTier ? (
            <div className={cardSurfaceClass}>
              <div className="flex items-center gap-3">
                <ReferralRankShield rankName={rank.next} size="sm" />
                <div>
                  <p className="text-xs text-muted-foreground">Next Rank Preview</p>
                  <p className="font-bold text-foreground">{nextShort}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>{nextTier.minMembers.toLocaleString()} Active Investors required</li>
                {nextTier.cashBonusUsd > 0 ? (
                  <li>${nextTier.cashBonusUsd.toLocaleString()} one-time bonus</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

export const ReferralMyRankSection = memo(ReferralMyRankSectionInner)
