'use client'

import { memo, useState } from 'react'
import { ChevronRight, Medal, Trophy } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import {
  ReferralRankPill,
  shortRankName,
} from '@/components/referral/shared/referral-rank-ui'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { sectionStackClass } from '@/lib/layout/spacing'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import { referralSectionHref } from '@/lib/referral/navigation'
import { cn } from '@/lib/utils'

type ReferralLeaderboardSectionProps = {
  overview: ReferralProgramOverview
}

const TABS = ['All Leaders', 'My Network', 'Rising Stars'] as const

function ReferralLeaderboardSectionInner({ overview }: ReferralLeaderboardSectionProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('All Leaders')
  const leaders = overview.leaderboard

  const topLeader = leaders[0]

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<Trophy className="h-5 w-5 text-amber-500" aria-hidden />}
        title="Leaderboard"
        subtitle="Top performers ranked by team commission contributions."
        action={
          <div className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-3 text-sm font-medium text-muted-foreground">
            This Month
          </div>
        }
      />

      <KpiGrid count={4} aria-label="Leaderboard summary">
        <KpiCard
          label="Top Leader"
          value={topLeader?.name ?? '—'}
          caption={topLeader ? formatCurrency(topLeader.earnings) : undefined}
          icon={<Medal className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Total Leaders"
          value={String(Math.max(leaders.length, overview.totalReferrals))}
          trend={overview.trends.newInvestors}
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Total Team Volume"
          value={formatCurrency(overview.activeInvestors * 1200)}
          trend="+22.4%"
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-blue-50 text-primary"
        />
        <KpiCard
          label="Total Rewards"
          value={formatCurrency(overview.lifetimeEarnings * 100)}
          trend="+19.3%"
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cardSurfaceClass}>
          <div className="flex flex-wrap gap-2 border-b border-border pb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold',
                  activeTab === tab
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 pr-4">Leader</th>
                  <th className="pb-3 pr-4">Rank Title</th>
                  <th className="pb-3 pr-4">Team Profit Share</th>
                  <th className="pb-3 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaders.length > 0 ? (
                  leaders.map((entry) => (
                    <tr key={entry.rank}>
                      <td className="py-3 pr-4">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {entry.rank}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">{entry.name}</td>
                      <td className="py-3 pr-4">
                        <ReferralRankPill rankName={overview.rank.current} />
                      </td>
                      <td className="py-3 pr-4 font-semibold text-emerald-600">
                        {formatCurrency(entry.earnings)}
                      </td>
                      <td className="py-3 text-right text-emerald-600">+12%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Share your link to appear on the leaderboard when your network earns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {leaders.length > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Showing 1 to {leaders.length} of {Math.max(leaders.length, overview.totalReferrals)}{' '}
              leaders in your network
            </p>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className={cardSurfaceClass}>
            <p className="text-xs text-muted-foreground">Your Ranking</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              #{Math.max(1, leaders.findIndex((l) => l.earnings <= overview.thisMonthEarnings) + 1)}
            </p>
            <ReferralRankPill rankName={overview.rank.current} />
            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Progress to {shortRankName(overview.rank.next)}
                </span>
                <span className="font-semibold">{overview.rank.progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-violet-600"
                  style={{ width: `${overview.rank.progressPercent}%` }}
                />
              </div>
            </div>
            <Link
              href={referralSectionHref('rank')}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-sm font-semibold text-white"
            >
              View My Rank Progress
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 text-white">
            <Trophy className="h-10 w-10 text-amber-400" aria-hidden />
            <p className="mt-3 font-semibold">Hall of Fame</p>
            <p className="mt-1 text-sm text-slate-300">
              Celebrate top ambassadors and lifetime achievers.
            </p>
            <Link
              href={referralSectionHref('benefits')}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white"
            >
              Explore Hall of Fame
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

export const ReferralLeaderboardSection = memo(ReferralLeaderboardSectionInner)
