'use client'

import { Fragment, useEffect, useId, useMemo, useState } from 'react'
import {
  Award,
  BookOpen,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Crown,
  Gem,
  HelpCircle,
  Mail,
  Medal,
  MessageCircle,
  Share2,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
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
import { AsyncState, EmptyState, ErrorState } from '@/components/shared/data-state'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { ReferralAchievementsBadgesPanel } from '@/components/referral/ReferralAchievementsBadgesPanel'
import { ReferralQrCode } from '@/components/referral/ReferralQrCode'
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
  REFERRAL_INVESTMENT_COMMISSION_RATE,
  REFERRAL_RANK_TIERS,
  formatProfitShareLevelsSummary,
  formatReferralRate,
  getMaxProfitShareRate,
  type ReferralRankKey,
} from '@/lib/referral/program-config'
import { cn } from '@/lib/utils'

const BENEFIT_CARDS = [
  {
    title: 'Investment Commission',
    lead: '',
    highlight: `Earn ${formatReferralRate(REFERRAL_INVESTMENT_COMMISSION_RATE)} on every deposit`,
    footer: 'One-time commission',
    icon: CircleDollarSign,
    accent: 'bg-orange-50 text-orange-500',
  },
  {
    title: 'Weekly Profit Share',
    lead: '',
    highlight: `Earn up to ${formatReferralRate(getMaxProfitShareRate())} weekly`,
    footer: 'Lifetime earnings',
    icon: TrendingUp,
    accent: 'bg-blue-50 text-[#0052ff]',
  },
  {
    title: '4 Levels Deep',
    lead: '',
    highlight: formatProfitShareLevelsSummary(),
    footer: 'Unlimited generations',
    icon: Users,
    accent: 'bg-emerald-50 text-emerald-600',
  },
] as const

const SHARE_ACTIONS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
  { key: 'telegram', label: 'Telegram', icon: Zap, color: 'text-[#0052ff]' },
  { key: 'facebook', label: 'Facebook', icon: Share2, color: 'text-blue-600' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-gray-600' },
  { key: 'sms', label: 'SMS', icon: MessageCircle, color: 'text-violet-600' },
  { key: 'copy', label: 'Copy', icon: Copy, color: 'text-gray-700' },
] as const

function ReferralFunnelPanel({ funnel }: { funnel: ReferralProgramOverview['funnel'] }) {
  const gradientId = useId().replace(/:/g, '')
  const clicks = funnel.clicks.toLocaleString()
  const signups = funnel.signups.toLocaleString()
  const activeInvestors = funnel.activeInvestors.toLocaleString()
  const conversionRate = Number(funnel.conversionRate).toFixed(2)

  const statRows = [
    { key: 'clicks', value: clicks },
    { key: 'signups', value: signups },
    {
      key: 'active',
      label: 'Active Investors',
      value: activeInvestors,
    },
  ] as const

  return (
    <div className="h-fit w-full self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">Conversion Funnel</h3>

      <div className="mt-3 flex items-start gap-3 sm:gap-4">
        <div className="relative w-[9.5rem] shrink-0 sm:w-[10.5rem]">
          <svg
            viewBox="0 0 200 188"
            className="h-auto w-full"
            role="img"
            aria-label={`Conversion funnel: ${clicks} clicks, ${signups} signups, ${activeInvestors} active investors`}
          >
            <defs>
              <linearGradient id={`${gradientId}-purple`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id={`${gradientId}-blue`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id={`${gradientId}-green`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id={`${gradientId}-orange`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            <path d="M 18 2 L 182 2 L 162 44 L 38 44 Z" fill={`url(#${gradientId}-purple)`} />
            <rect x="0" y="44" width="200" height="3" fill="#ffffff" />
            <path d="M 38 47 L 162 47 L 142 89 L 58 89 Z" fill={`url(#${gradientId}-blue)`} />
            <rect x="0" y="89" width="200" height="3" fill="#ffffff" />
            <path d="M 58 92 L 142 92 L 122 134 L 78 134 Z" fill={`url(#${gradientId}-green)`} />
            <rect x="0" y="134" width="200" height="3" fill="#ffffff" />
            <path d="M 78 137 L 122 137 L 122 177 L 78 177 Z" fill={`url(#${gradientId}-orange)`} />

            <text
              x="100"
              y="28"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="13"
              fontWeight="600"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              Clicks
            </text>
            <text
              x="100"
              y="73"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="13"
              fontWeight="600"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              Signups
            </text>
            <text
              x="100"
              y="118"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="700"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {activeInvestors}
            </text>
          </svg>

          <div className="pointer-events-none absolute bottom-[6%] left-1/2 flex h-[21%] w-[22%] -translate-x-1/2 items-center justify-center">
            <Crown className="h-4 w-4 text-white sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
          </div>
        </div>

        <div className="flex min-h-[11.75rem] flex-1 flex-col justify-between py-0.5 sm:min-h-[12.5rem]">
          {statRows.map((row) => (
            <div
              key={row.key}
              className={cn(
                'flex min-h-[2.65rem] items-center sm:min-h-[2.85rem]',
                row.key === 'active' && 'flex-col items-start justify-center'
              )}
            >
              {'label' in row ? (
                <>
                  <p className="text-[11px] font-medium leading-tight text-gray-500">{row.label}</p>
                  <p className="text-lg font-bold tabular-nums leading-none text-gray-900 sm:text-xl">
                    {row.value}
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold tabular-nums leading-none text-gray-900 sm:text-xl">
                  {row.value}
                </p>
              )}
            </div>
          ))}
          <div className="min-h-[2.4rem]" aria-hidden />
        </div>
      </div>

      <p className="mt-2 text-right text-sm font-semibold text-emerald-600">
        Conversion Rate: {conversionRate}%
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

function healthScoreStyles(label: string) {
  if (label === 'Excellent') {
    return { stroke: '#10b981', text: 'text-emerald-600' }
  }
  if (label === 'Good') {
    return { stroke: '#0052ff', text: 'text-[#0052ff]' }
  }
  return { stroke: '#f59e0b', text: 'text-amber-600' }
}

function ReferralHealthScoreGauge({ score, label }: { score: number; label: string }) {
  const size = 72
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score))
  const offset = circumference - (progress / 100) * circumference
  const { stroke: strokeColor, text: labelColor } = healthScoreStyles(label)

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm xl:min-w-[150px]">
      <p className="text-[10px] font-medium text-gray-500 sm:text-[11px]">Health Score</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="relative shrink-0">
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold leading-none text-gray-900">
              {score}
              <span className="text-[10px] font-medium text-gray-400"> /100</span>
            </span>
          </div>
        </div>
        <p className={cn('text-right text-xs font-semibold sm:text-sm', labelColor)}>{label}</p>
      </div>
    </div>
  )
}

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

function isMaxRankMetric(rank: ReferralProgramOverview['rank']) {
  return rank.current === rank.next
}

function resolveRankKeyFromName(name: string): ReferralRankKey {
  const tier = REFERRAL_RANK_TIERS.find((row) => row.name === name)
  return tier?.key ?? 'bronze'
}

const RANK_BADGE_STYLES: Record<
  ReferralRankKey,
  { shell: string; icon: typeof Gem; iconClass: string; nameClass: string }
> = {
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
    const isCurrent = tier.name === currentRank
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

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-1 sm:px-2">
      <p className="relative z-10 bg-white px-2 text-center text-sm font-semibold text-slate-800">
        Level {levelNumber} ({level.count})
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
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">My Referral Network</h3>
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

function buildShareUrl(channel: string, link: string, code: string) {
  const text = `Join me on PrimeFx Invest and start investing smarter. Use my referral link: ${link}`
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(text)}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    case 'email':
      return `mailto:?subject=${encodeURIComponent('Join PrimeFx Invest')}&body=${encodeURIComponent(text)}`
    case 'sms':
      return `sms:?body=${encodeURIComponent(text)}`
    default:
      return link
  }
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

  const handleShare = async (channel: string) => {
    if (!referralData?.referralLink) return
    if (channel === 'copy') {
      await copyLink()
      return
    }
    window.open(
      buildShareUrl(channel, referralData.referralLink, referralData.referralCode),
      '_blank',
      'noopener,noreferrer'
    )
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

  if (!overview || !referralData) return null

  const metricCards = [
    { label: 'Lifetime Earnings', value: formatCurrency(overview.lifetimeEarnings), trend: overview.trends.lifetime },
    { label: 'This Week', value: formatCurrency(overview.thisWeekEarnings), trend: overview.trends.week },
    { label: 'This Month', value: formatCurrency(overview.thisMonthEarnings), trend: overview.trends.month },
    { label: 'Active Investors', value: String(overview.activeInvestors), trend: overview.trends.newInvestors },
    { label: 'Total Referrals', value: String(overview.totalReferrals) },
    {
      label: 'Current Rank',
      value: shortRankName(overview.rank.current),
      sub: isMaxRankMetric(overview.rank)
        ? 'Maximum rank'
        : `${overview.rank.membersRemaining} more for ${shortRankName(overview.rank.next)}`,
      icon: Crown,
    },
  ]

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Referral Program</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>
          <p className="mt-1 text-gray-500">Build Your Network. Grow Your Wealth.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <HelpCircle className="h-4 w-4" />
            How It Works
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BookOpen className="h-4 w-4" />
            Referral Rules
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col divide-y divide-gray-200 xl:flex-row xl:divide-x xl:divide-y-0">
          {BENEFIT_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="flex min-w-0 flex-1 flex-col p-5">
                <div
                  className={cn(
                    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                    card.accent
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {card.lead}
                  <span className="font-semibold text-gray-900">{card.highlight}</span>
                </p>
                <p className="mt-2 text-xs text-gray-400">{card.footer}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          {metricCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm sm:px-3 sm:py-3"
              >
                <p className="text-[10px] font-medium leading-tight text-gray-500 sm:text-[11px]">
                  {stat.label}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  {Icon ? <Icon className="h-4 w-4 shrink-0 text-violet-600" /> : null}
                  <p className="text-base font-bold leading-tight text-gray-900">{stat.value}</p>
                </div>
                {stat.trend ? (
                  <p className="mt-0.5 text-[10px] font-semibold text-emerald-600 sm:text-[11px]">
                    {stat.trend}
                  </p>
                ) : null}
                {stat.sub ? (
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-gray-400">{stat.sub}</p>
                ) : null}
              </div>
            )
          })}
        </div>
        <ReferralHealthScoreGauge score={overview.healthScore} label={overview.healthLabel} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <ReferralRankProgressPanel rank={overview.rank} />

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

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="h-full lg:col-span-2">
              <ReferralNetworkPanel levels={overview.networkLevels} />
            </div>
            <ReferralChannelsPanel channels={overview.channels} />
          </div>

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

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <ReferralAllReferralsSection referrals={referrals} onCopyLink={copyLink} />
            <ReferralFunnelPanel funnel={overview.funnel} />
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Your Referral Link</h3>
            <AsyncState
              loading={loading && !referralData}
              error={error}
              onRetry={reload}
              compact
              skeleton={<div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />}
            >
              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={referralData.referralLink}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0052ff] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </AsyncState>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SHARE_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleShare(action.key)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 px-2 py-2.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Icon className={cn('h-4 w-4', action.color)} />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <h3 className="font-semibold text-gray-900">Referral QR Code</h3>
            <div className="mt-4">
              <ReferralQrCode value={referralData.referralLink} />
            </div>
            {referralData.referralCode ? (
              <p className="mt-2 text-xs text-gray-500">
                Code: <span className="font-semibold text-gray-800">{referralData.referralCode}</span>
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Top Referrers This Month</h3>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            {overview.leaderboard.length > 0 ? (
              <ul className="space-y-3">
                {overview.leaderboard.map((entry) => (
                  <li key={entry.rank} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                        {entry.rank}
                      </span>
                      <span className="font-medium text-gray-900">{entry.name}</span>
                    </span>
                    <span className="font-semibold text-emerald-600">
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
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              View Full Leaderboard
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Referral rank rewards</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-600">
                  {REFERRAL_RANK_TIERS.map((tier) => (
                    <li key={tier.key}>
                      <span className="font-semibold text-gray-800">{shortRankName(tier.name)}</span>
                      {' — '}
                      {tier.minMembers.toLocaleString()} active members
                      {tier.cashBonusUsd > 0 ? ` · $${tier.cashBonusUsd.toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/support"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0052ff] hover:underline"
                >
                  View program terms
                  <Target className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReferralRankLevelsPanel
        activeInvestors={overview.activeInvestors}
        currentRank={overview.rank.current}
        nextRank={overview.rank.next}
      />
    </div>
  )
}
