'use client'

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Award,
  ChevronRight,
  Copy,
  Crown,
  Gem,
  Medal,
  Share2,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { EmptyState, ErrorState } from '@/components/shared/data-state'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { ReferralAchievementsBadgesPanel } from '@/components/referral/ReferralAchievementsBadgesPanel'
import { ReferralCommissionSection } from '@/components/referral/ReferralCommissionSection'
import { ReferralHeroSection } from '@/components/referral/ReferralHeroSection'
import { ReferralLinkCenter } from '@/components/referral/ReferralLinkCenter'
import { ReferralPrimeAiInsights } from '@/components/referral/ReferralPrimeAiInsights'
import { ReferralStatsGrid } from '@/components/referral/ReferralStatsGrid'
import { ReferralTransparencySection } from '@/components/referral/ReferralTransparencySection'
import { pageStackClass, sectionStackClass } from '@/lib/layout/spacing'
import { MetricCardsSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import {
  areaChartActiveDot,
  chartAxisStyle,
  chartGridStyle,
  ChartTooltipContent,
  chartTooltipCursor,
  chartTooltipWrapperProps,
  formatCurrency as formatChartCurrency,
  PieTooltipContent,
} from '@/components/charts/ChartTooltip'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { formatCurrency } from '@/lib/data/format'
import { fetchReferralProgramOverviewAction } from '@/lib/referral/actions'
import {
  buildEarningsChartForPeriod,
  getChartAxisInterval,
  type ReferralChartPeriod,
} from '@/lib/referral/earnings-chart'
import type { ReferralListItem, ReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralProgramPageData } from '@/lib/referral/overview-server'
import {
  REFERRAL_RANK_TIERS,
  REFERRAL_UNRANKED,
  type ReferralRankKey,
} from '@/lib/referral/program-config'
import { REFERRAL_DISPLAY_PROFIT_SHARE } from '@/lib/referral/display-config'
import { cn } from '@/lib/utils'

function ReferralFunnelPanel({ funnel }: { funnel: ReferralProgramOverview['funnel'] }) {
  const clicks = funnel.clicks.toLocaleString()
  const signups = funnel.signups.toLocaleString()
  const deposits = funnel.activeInvestors.toLocaleString()
  const activeInvestors = funnel.activeInvestors.toLocaleString()
  const conversionRate = Number(funnel.conversionRate).toFixed(2)

  const statRows = [
    { key: 'clicks', label: 'Link clicks', value: clicks },
    { key: 'signups', label: 'Signups', value: signups },
    { key: 'deposits', label: 'Deposits', value: deposits },
    { key: 'active', label: 'Active investors', value: activeInvestors },
  ] as const

  return (
    <div className="h-fit w-full self-start rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-gray-900">Conversion funnel</h3>
      <p className="mt-1 text-xs text-gray-500">From link click to active investor</p>

      <div className="mt-4 space-y-3">
        {statRows.map((row, index) => {
          const width = `${100 - index * 18}%`
          return (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">{row.label}</span>
                <span className="font-bold tabular-nums text-gray-900">{row.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0052ff] to-violet-500 transition-all duration-700"
                  style={{ width }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-right text-sm font-semibold text-emerald-600">
        Conversion rate: {conversionRate}%
      </p>
    </div>
  )
}

function referralStatusClass(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Pending') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

function ReferralAllReferralsSection({
  referrals,
  onCopyLink,
}: {
  referrals: ReferralListItem[]
  onCopyLink: () => void
}) {
  return (
    <div
      id="all-referrals"
      className="scroll-mt-24 min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <h3 className="font-semibold text-gray-900">All Referrals</h3>
        <Link href="/transactions" className="text-sm font-semibold text-[#0052ff] hover:underline">
          View transactions
        </Link>
      </div>

      <div className="min-w-0 p-4 sm:p-6">
        {referrals.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No referrals yet"
            description="Share your referral link to invite friends and start earning commissions."
            action={
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Copy className="h-4 w-4" />
                Copy referral link
              </button>
            }
            compact
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100 md:hidden">
              {referrals.map((referral) => (
                <li key={referral.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{referral.name}</p>
                      <p className="truncate text-xs text-gray-500">{referral.email}</p>
                      <p className="mt-1 text-xs text-gray-400">{referral.joinedDate}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          referralStatusClass(referral.status)
                        )}
                      >
                        {referral.status}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        {formatCurrency(referral.commissionEarned)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <table className="hidden w-full table-fixed md:table">
              <colgroup>
                <col style={{ width: '36%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-2">Name</th>
                  <th className="pb-3 pr-2">Status</th>
                  <th className="pb-3 pr-2">Joined</th>
                  <th className="pb-3 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="overflow-hidden py-3 pr-2">
                      <p className="truncate font-medium text-gray-900">{referral.name}</p>
                      <p className="truncate text-xs text-gray-500">{referral.email}</p>
                    </td>
                    <td className="py-3 pr-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs',
                          referralStatusClass(referral.status)
                        )}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="truncate py-3 pr-2 text-sm text-gray-500">{referral.joinedDate}</td>
                    <td className="py-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(referral.commissionEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

function resolveRankKeyFromName(name: string): ReferralRankKey | 'none' {
  if (name === REFERRAL_UNRANKED.name) return 'none'
  const tier = REFERRAL_RANK_TIERS.find((row) => row.name === name)
  return tier?.key ?? 'none'
}

const RANK_BADGE_STYLES: Record<
  ReferralRankKey | 'none',
  { shell: string; icon: typeof Gem; iconClass: string; nameClass: string }
> = {
  none: {
    shell: 'bg-gradient-to-br from-slate-50 to-slate-100 ring-slate-200/80',
    icon: Users,
    iconClass: 'text-slate-500',
    nameClass: 'text-slate-600',
  },
  bronze: {
    shell: 'bg-gradient-to-br from-amber-100 to-orange-100 ring-amber-200/80',
    icon: Medal,
    iconClass: 'text-amber-700',
    nameClass: 'text-amber-800',
  },
  silver: {
    shell: 'bg-gradient-to-br from-slate-100 to-gray-200 ring-slate-200/80',
    icon: Shield,
    iconClass: 'text-slate-600',
    nameClass: 'text-slate-700',
  },
  gold: {
    shell: 'bg-gradient-to-br from-yellow-100 to-amber-100 ring-amber-200/80',
    icon: Award,
    iconClass: 'text-amber-600',
    nameClass: 'text-amber-700',
  },
  platinum: {
    shell: 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-blue-200/80',
    icon: Star,
    iconClass: 'text-blue-600',
    nameClass: 'text-blue-700',
  },
  diamond: {
    shell: 'bg-gradient-to-br from-violet-100 to-purple-200 ring-violet-200/80',
    icon: Gem,
    iconClass: 'text-violet-600',
    nameClass: 'text-violet-700',
  },
  ambassador: {
    shell: 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-200 ring-amber-300/80',
    icon: Crown,
    iconClass: 'text-amber-700',
    nameClass: 'text-amber-700',
  },
}

function ReferralRankBadge({ rankName }: { rankName: string; variant: 'current' | 'next' }) {
  const rankKey = resolveRankKeyFromName(rankName)
  const style = RANK_BADGE_STYLES[rankKey]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'relative flex h-14 w-12 shrink-0 items-center justify-center shadow-sm [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]',
        style.shell
      )}
    >
      <Icon className={cn('h-7 w-7', style.iconClass)} />
    </div>
  )
}

function ReferralRankSide({
  rankName,
  variant,
  caption,
}: {
  rankName: string
  variant: 'current' | 'next'
  caption: string
}) {
  const style = RANK_BADGE_STYLES[resolveRankKeyFromName(rankName)]
  const short = shortRankName(rankName)

  return (
    <div className="flex items-center gap-4 px-5 py-5 lg:px-6">
      <ReferralRankBadge rankName={rankName} variant={variant} />
      <div className="min-w-0">
        <p className={cn('text-lg font-bold leading-tight', style.nameClass)}>{short}</p>
        <p className="mt-1 text-xs text-gray-400">{caption}</p>
      </div>
    </div>
  )
}

function ReferralRankProgressPanel({ rank }: { rank: ReferralProgramOverview['rank'] }) {
  const nextShort = shortRankName(rank.next)
  const isMaxRank = rank.current === rank.next

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="shrink-0 border-b border-gray-200 lg:border-b-0">
          <ReferralRankSide rankName={rank.current} variant="current" caption="Your Current Rank" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center border-b border-gray-200 px-5 py-5 lg:border-b-0 lg:border-x lg:px-8">
          <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
            <span>{isMaxRank ? 'Maximum rank achieved' : `Progress to ${nextShort}`}</span>
            <span className="tabular-nums">
              <span className="font-bold text-slate-900">
                {rank.activeInvestors.toLocaleString()}
              </span>
              <span className="text-slate-400"> / {rank.nextThreshold.toLocaleString()}</span>
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="shrink-0 text-base font-bold leading-snug text-slate-900 sm:text-lg">
              {isMaxRank
                ? 'All rank levels unlocked'
                : rank.membersRemaining === 0
                  ? `Ready for ${nextShort}!`
                  : `${rank.membersRemaining.toLocaleString()} more active member${rank.membersRemaining === 1 ? '' : 's'} required`}
            </p>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all duration-700"
                  style={{
                    width: `${Math.max(rank.progressPercent, rank.progressPercent > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-sm font-semibold text-violet-600">
                {rank.progressPercent}%
              </span>
            </div>
          </div>
          {!isMaxRank ? (
            <p className="mt-2 text-xs text-slate-500">
              {rank.nextThreshold.toLocaleString()} active members required to reach {nextShort}
            </p>
          ) : null}
        </div>

        <div className="shrink-0">
          <ReferralRankSide
            rankName={rank.next}
            variant="next"
            caption={isMaxRank ? 'Top Rank' : 'Next Rank'}
          />
        </div>
      </div>
    </div>
  )
}

function formatRankReward(tier: (typeof REFERRAL_RANK_TIERS)[number]) {
  const parts: string[] = []
  if (tier.cashBonusUsd > 0) {
    parts.push(`$${tier.cashBonusUsd.toLocaleString()} bonus`)
  }
  if (tier.perks.length > 0) {
    parts.push(...tier.perks)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Rank recognition'
}

function ReferralRankStatusBadge({
  unlocked,
  isCurrent,
  isNext,
}: {
  unlocked: boolean
  isCurrent: boolean
  isNext: boolean
}) {
  if (isCurrent) {
    return (
      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
        Current
      </span>
    )
  }
  if (isNext) {
    return (
      <span className="rounded-full bg-[#0052ff] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
        Next
      </span>
    )
  }
  if (unlocked) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
        Achieved
      </span>
    )
  }
  return (
    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
      Locked
    </span>
  )
}

function ReferralRankLevelsPanel({
  activeInvestors,
  currentRank,
  nextRank,
}: {
  activeInvestors: number
  currentRank: string
  nextRank: string
}) {
  const rows = REFERRAL_RANK_TIERS.map((tier) => {
    const unlocked = activeInvestors >= tier.minMembers
    const isCurrent = unlocked && tier.name === currentRank
    const isNext = tier.name === nextRank && currentRank !== nextRank
    const membersRemaining = Math.max(0, tier.minMembers - activeInvestors)

    return { tier, unlocked, isCurrent, isNext, membersRemaining }
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Rank Levels & Member Requirements</h3>
          <p className="mt-1 text-sm text-gray-500">
            Active members in your network determine your referral rank and rewards.
          </p>
        </div>
        <p className="text-sm font-semibold text-[#0052ff]">
          You have {activeInvestors.toLocaleString()} active member{activeInvestors === 1 ? '' : 's'}
        </p>
      </div>

      {/* Mobile / tablet: stacked cards */}
      <div className="mt-4 space-y-2 lg:hidden">
        {rows.map(({ tier, unlocked, isCurrent, isNext, membersRemaining }) => (
          <div
            key={tier.key}
            className={cn(
              'rounded-xl border px-4 py-3 transition-colors',
              isCurrent
                ? 'border-violet-300 bg-violet-50'
                : isNext
                  ? 'border-[#0052ff]/30 bg-blue-50/50'
                  : unlocked
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-gray-100 bg-gray-50'
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{shortRankName(tier.name)}</p>
                  <ReferralRankStatusBadge
                    unlocked={unlocked}
                    isCurrent={isCurrent}
                    isNext={isNext}
                  />
                </div>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {tier.minMembers.toLocaleString()} active members required
                </p>
                <p className="mt-1 text-xs text-gray-500">{formatRankReward(tier)}</p>
              </div>
              <div className="shrink-0 text-right">
                {unlocked ? (
                  <p className="text-xs font-semibold text-emerald-600">Unlocked</p>
                ) : (
                  <p className="text-xs font-semibold text-gray-600">
                    {membersRemaining.toLocaleString()} more needed
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Laptop / desktop: table */}
      <ScrollTable className="mt-4 hidden lg:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Members required</th>
              <th className="px-4 py-3">Rewards</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ tier, unlocked, isCurrent, isNext, membersRemaining }) => (
              <tr
                key={tier.key}
                className={cn(
                  'transition-colors',
                  isCurrent
                    ? 'bg-violet-50/80'
                    : isNext
                      ? 'bg-blue-50/40'
                      : unlocked
                        ? 'bg-emerald-50/30'
                        : 'hover:bg-gray-50/80'
                )}
              >
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-gray-900">{shortRankName(tier.name)}</p>
                </td>
                <td className="px-4 py-3.5 font-medium tabular-nums text-gray-700">
                  {tier.minMembers.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-gray-600">{formatRankReward(tier)}</td>
                <td className="px-4 py-3.5">
                  <ReferralRankStatusBadge
                    unlocked={unlocked}
                    isCurrent={isCurrent}
                    isNext={isNext}
                  />
                </td>
                <td className="px-4 py-3.5 text-right">
                  {unlocked ? (
                    <span className="font-semibold text-emerald-600">Unlocked</span>
                  ) : (
                    <span className="font-semibold text-gray-600">
                      {membersRemaining.toLocaleString()} more needed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    </div>
  )
}

function NetworkLevelConnector() {
  return (
    <div
      className="relative z-10 flex w-10 shrink-0 justify-center self-start sm:w-14"
      aria-hidden
    >
      <div className="flex flex-col items-center pt-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white" />
        <div className="h-16 w-px bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white" />
      </div>
    </div>
  )
}

function NetworkLevelColumn({
  level,
  index,
}: {
  level: ReferralProgramOverview['networkLevels'][number]
  index: number
}) {
  const visibleMembers = level.members.slice(0, 4)
  const overflow = Math.max(0, level.count - visibleMembers.length)
  const levelNumber = index + 1
  const displayRate = REFERRAL_DISPLAY_PROFIT_SHARE[index]?.rate ?? ''

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-1 sm:px-2">
      <p className="relative z-10 bg-white px-2 text-center text-sm font-semibold text-slate-800">
        Level {levelNumber}
      </p>
      <p className="relative z-10 mt-0.5 bg-white px-2 text-center text-[11px] font-medium text-[#0052ff]">
        {displayRate} weekly share
      </p>
      <p className="relative z-10 bg-white px-2 text-center text-xs text-slate-500">
        {level.count} member{level.count === 1 ? '' : 's'}
      </p>

      <div className="mt-8 flex min-h-[44px] items-center justify-center">
        {level.count > 0 ? (
          visibleMembers.length > 0 ? (
            <div className="flex items-center">
              <div className="flex -space-x-2.5">
                {visibleMembers.map((member, memberIndex) => (
                  <span
                    key={member.id}
                    title={member.name}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm',
                      memberIndex % 4 === 0 && 'bg-[#0052ff]',
                      memberIndex % 4 === 1 && 'bg-violet-500',
                      memberIndex % 4 === 2 && 'bg-sky-500',
                      memberIndex % 4 === 3 && 'bg-indigo-500'
                    )}
                  >
                    {member.initials}
                  </span>
                ))}
              </div>
              {overflow > 0 ? (
                <span className="ml-2 text-sm font-semibold text-[#0052ff]">+{overflow}</span>
              ) : null}
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#0052ff]">+{level.count}</span>
          )
        ) : (
          <p className="text-xs text-gray-400">No members yet</p>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Total Earnings:{' '}
        <span className="font-bold text-emerald-600">{formatCurrency(level.earnings)}</span>
      </p>
    </div>
  )
}

function ReferralNetworkPanel({
  levels,
}: {
  levels: ReferralProgramOverview['networkLevels']
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Referral tree</h3>
          <p className="mt-0.5 text-xs text-slate-500">Levels 1–4 · weekly profit share</p>
        </div>
        <Link
          href="/referral#all-referrals"
          className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline"
        >
          View Full Network
        </Link>
      </div>

      <div className="relative mt-10 flex flex-1 items-start overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        <div
          className="pointer-events-none absolute inset-x-4 top-3 h-px bg-gray-200 sm:inset-x-6"
          aria-hidden
        />

        <div className="relative flex min-w-full items-start justify-between">
          {levels.map((level, index) => (
            <Fragment key={level.level}>
              <NetworkLevelColumn level={level} index={index} />
              {index < levels.length - 1 ? <NetworkLevelConnector /> : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReferralEarningsBreakdownCard({
  breakdown,
  chartsReady,
}: {
  breakdown: ReferralProgramOverview['earningsBreakdown']
  chartsReady: boolean
}) {
  const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0)
  const hasEarnings = totalAmount > 0

  // Clockwise from top: top-right, bottom-right, bottom-left, top-left ↔ L2, L4, L3, L1
  const pieSliceOrder = [1, 3, 2, 0]

  const pieData = hasEarnings
    ? breakdown.filter((item) => item.value > 0)
    : pieSliceOrder.map((index) => ({
        ...breakdown[index],
        value: 25,
      }))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">Earnings Breakdown</h3>
      <div className="flex flex-col items-center gap-5">
        <div className="relative mx-auto h-[180px] w-full max-w-[200px]">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={hasEarnings ? 3 : 2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                {hasEarnings ? (
                  <Tooltip
                    {...chartTooltipWrapperProps}
                    content={<PieTooltipContent valueSuffix="%" />}
                  />
                ) : null}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-full bg-gray-100" />
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Total</p>
            <p className="mt-0.5 text-base font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3">
          {breakdown.map((item) => (
            <div key={item.name} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium leading-tight text-gray-700">{item.name}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2 pl-[18px]">
                <span className="text-xs font-bold text-gray-900">{formatCurrency(item.amount)}</span>
                <span className="text-xs font-semibold text-gray-500">
                  {hasEarnings ? `${item.value}%` : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReferralChannelsPanel({
  channels,
}: {
  channels: ReferralProgramOverview['channels']
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">Top Performing Channels</h3>
      <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
        {channels.length === 0 ? (
          <p className="text-sm text-gray-500">
            Channel tracking is not available yet. Share your referral link to grow signups.
          </p>
        ) : (
          channels.map((channel) => (
            <div key={channel.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{channel.name}</span>
                <span className="font-medium text-gray-500">{channel.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function ReferralProgramView({
  initialOverview = null,
}: {
  initialOverview?: ReferralProgramPageData | null
}) {
  const { data, loading, error, reload } = useAsyncData(
    () => fetchReferralProgramOverviewAction(),
    [],
    initialOverview ?? undefined
  )
  const [chartPeriod, setChartPeriod] = useState<'30' | '90' | '365'>('30')
  const [chartsReady, setChartsReady] = useState(false)

  useEffect(() => {
    setChartsReady(true)
  }, [])

  const referralData = data?.referralData
  const referrals = data?.referrals ?? []
  const overview = data?.overview

  const copyLink = async () => {
    if (!referralData?.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const chartData = useMemo(() => {
    if (!overview) return []
    const period = Number(chartPeriod) as ReferralChartPeriod
    return buildEarningsChartForPeriod(
      overview.earningsTimeline,
      period,
      Math.max(overview.lifetimeEarnings, 0)
    )
  }, [overview, chartPeriod])

  const chartAxisInterval = useMemo(() => {
    const period = Number(chartPeriod) as ReferralChartPeriod
    return getChartAxisInterval(period, chartData.length)
  }, [chartPeriod, chartData.length])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <MetricCardsSkeleton count={4} />
        <MetricCardsSkeleton count={3} />
      </div>
    )
  }

  if (error && !data) {
    return (
      <ErrorState title="Could not load referral program" description={error} onRetry={reload} />
    )
  }

  if (!overview || !referralData) {
    return (
      <EmptyState
        title="Referral data unavailable"
        description="We could not load your referral overview. Please try again."
        action={
          <button
            type="button"
            onClick={() => reload()}
            className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div className={cn('min-w-0', pageStackClass)}>
      <ReferralHeroSection overview={overview} />

      <ReferralCommissionSection />

      <ReferralStatsGrid overview={overview} />

      <div className="xl:hidden">
        <ReferralLinkCenter
          referralData={referralData}
          loading={loading}
          error={error}
          onRetry={reload}
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <section aria-label="Rank progression" className={sectionStackClass}>
            <SectionHeading>Rank progression</SectionHeading>
          <ReferralRankProgressPanel rank={overview.rank} />
          </section>

          <section aria-label="Earnings analytics" className="space-y-3">
            <SectionHeading>Earnings analytics</SectionHeading>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-gray-900">Earnings Overview</h3>
                <div className="grid w-full grid-cols-3 gap-0.5 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 text-[11px] sm:flex sm:w-auto sm:gap-0 sm:bg-transparent">
                  {(['30', '90', '365'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setChartPeriod(period)}
                      className={cn(
                        'rounded-md px-2 py-2 font-semibold whitespace-nowrap sm:px-3 sm:py-1.5',
                        chartPeriod === period
                          ? 'bg-[#0052ff] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white sm:hover:bg-gray-50'
                      )}
                    >
                      <span className="sm:hidden">{period === '365' ? '1Y' : `${period}D`}</span>
                      <span className="hidden sm:inline">
                        {period === '365' ? '365 Days' : `${period} Days`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {chartsReady ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="referralEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0052ff" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#0052ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chartGridStyle} />
                    <XAxis
                      dataKey="label"
                      {...chartAxisStyle}
                      dy={8}
                      interval={chartAxisInterval}
                      minTickGap={12}
                    />
                    <YAxis {...chartAxisStyle} width={40} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      {...chartTooltipWrapperProps}
                      cursor={chartTooltipCursor}
                      content={
                        <ChartTooltipContent
                          valueFormatter={(value) => formatChartCurrency(value)}
                          labelFormatter={(label) => String(label)}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      name="Earnings"
                      stroke="#0052ff"
                      strokeWidth={2.5}
                      fill="url(#referralEarnings)"
                      dot={false}
                      activeDot={areaChartActiveDot}
                    />
                    <Area
                      type="monotone"
                      dataKey="potential"
                      name="Potential"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] animate-pulse rounded-lg bg-gray-100" />
              )}
            </div>

            <ReferralEarningsBreakdownCard
              breakdown={overview.earningsBreakdown}
              chartsReady={chartsReady}
            />
          </div>
          </section>

          <section aria-label="Network overview" className="space-y-3">
            <SectionHeading>Network overview</SectionHeading>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="h-full lg:col-span-2">
              <ReferralNetworkPanel levels={overview.networkLevels} />
            </div>
            <ReferralChannelsPanel channels={overview.channels} />
          </div>
          </section>

          <section aria-label="Activity and achievements" className="space-y-3">
            <SectionHeading>Activity & achievements</SectionHeading>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="flex flex-col gap-4 lg:col-span-1">
              <div className="h-fit w-full self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900">Recent Activities</h3>
                <div className="mt-3 space-y-2">
                  {overview.recentActivities.length > 0 ? (
                    overview.recentActivities.map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-600">{activity.amount}</span>
                          <span className="text-gray-400">{activity.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No activity yet"
                      description="Share your link to start earning referral commissions."
                      compact
                      className="border-0 bg-transparent"
                    />
                  )}
                </div>
              </div>

              <div className="h-fit w-full self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900">Active Challenges</h3>
                <div className="mt-3 space-y-3">
                  {overview.challenges.map((challenge) => (
                    <div key={challenge.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{challenge.title}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {challenge.progress}/{challenge.target} completed
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {challenge.reward}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-[#0052ff]"
                          style={{
                            width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <ReferralAchievementsBadgesPanel badges={overview.badges} streak={overview.streak} />
            </div>
          </div>
          </section>

          <section aria-label="Referrals and funnel" className="space-y-3">
            <SectionHeading>Referrals & conversion</SectionHeading>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <ReferralAllReferralsSection referrals={referrals} onCopyLink={copyLink} />
            <ReferralFunnelPanel funnel={overview.funnel} />
          </div>
          </section>
        </div>

        <div className="hidden space-y-4 xl:sticky xl:top-24 xl:block xl:self-start">
        <ReferralLinkCenter
          referralData={referralData}
          loading={loading}
          error={error}
          onRetry={reload}
        />

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Top earning referrals</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Commissions from your network</p>
            </div>
            <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
            {overview.leaderboard.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {overview.leaderboard.map((entry) => (
                  <li key={entry.rank} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          entry.rank === 1
                            ? 'bg-amber-100 text-amber-800'
                            : entry.rank === 2
                              ? 'bg-slate-200 text-slate-700'
                              : entry.rank === 3
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {entry.rank}
                      </span>
                      <span className="truncate font-medium text-foreground">{entry.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-emerald-600">
                      {formatCurrency(entry.earnings)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No leaderboard data yet"
                description="Refer friends to climb the rankings."
                compact
                className="border-0 bg-transparent"
              />
            )}
            <a
              href="#all-referrals"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-border bg-muted/40 text-sm font-semibold text-primary transition-colors hover:bg-muted"
            >
              View all referrals
              <ChevronRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <ReferralPrimeAiInsights overview={overview} />

      <ReferralTransparencySection />

      <section aria-label="Rank levels" className={sectionStackClass}>
        <SectionHeading>All rank levels</SectionHeading>
      <ReferralRankLevelsPanel
        activeInvestors={overview.activeInvestors}
        currentRank={overview.rank.current}
        nextRank={overview.rank.next}
      />
      </section>
    </div>
  )
}
