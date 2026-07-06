import { formatCurrency } from '@/lib/data/format'
import {
  type EarningsTimelineDay,
} from '@/lib/referral/earnings-chart'
import {
  buildReferralBadgeState,
  type ReferralBadgeState,
  type ReferralStreakState,
} from '@/lib/referral/badges'
import {
  REFERRAL_PROFIT_SHARE_LEVELS,
  REFERRAL_RANK_TIERS,
  formatReferralRate,
  resolveReferralRank,
} from '@/lib/referral/program-config'

export interface ReferralListItem {
  id: string
  userId: string
  name: string
  email: string
  username: string | null
  avatarUrl: string | null
  country: string | null
  verified: boolean
  status: string
  commissionEarned: number
  joinedDate: string
  tradingVolume: string
  teamVolumeUsd: number
  investmentPlan: string | null
  rankName: string
  trendPercent: string | null
  networkLevel?: number
}

type OverviewContext = {
  lifetimeEarningsOverride?: number
  levelEarnings?: Array<{ level: number; earnings: number }>
  memberCount?: number
  activeInvestors?: number
  teamVolumeUsd?: number
  teamProfitUsd?: number
  teamVolumeTrend?: string
  teamProfitTrend?: string
  pendingCommissionUsd?: number
  thisWeekEarnings?: number
  thisMonthEarnings?: number
  earningsTimeline?: EarningsTimelineDay[]
  periodTrends?: {
    week?: string
    month?: string
    lifetime?: string
  }
  referralDates?: Date[]
  memberRankNames?: Map<string, string>
}

export interface ReferralRank {
  current: string
  next: string
  currentThreshold: number
  nextThreshold: number
  progressPercent: number
  activeInvestors: number
  membersRemaining: number
}

export interface ReferralProgramOverview {
  lifetimeEarnings: number
  thisWeekEarnings: number
  thisMonthEarnings: number
  activeInvestors: number
  totalReferrals: number
  rank: ReferralRank
  healthScore: number
  healthLabel: string
  earningsTimeline: EarningsTimelineDay[]
  earningsBreakdown: Array<{ name: string; value: number; amount: number; color: string }>
  networkLevels: Array<{
    level: string
    count: number
    earnings: number
    members: Array<{ id: string; name: string; initials: string }>
  }>
  channels: Array<{ name: string; percent: number; color: string }>
  funnel: { clicks: number; signups: number; activeInvestors: number; conversionRate: number }
  recentActivities: Array<{ id: string; message: string; amount: string; time: string }>
  badges: ReferralBadgeState[]
  streak: ReferralStreakState
  /** @deprecated Use badges — kept for type compatibility during migration */
  achievements: Array<{
    id: string
    label: string
    minMembers: number
    cashBonusUsd: number
    perks: readonly string[]
    unlocked: boolean
    membersRemaining: number
  }>
  challenges: Array<{ id: string; title: string; progress: number; target: number; reward: string }>
  teamVolumeUsd: number
  teamProfitUsd: number
  pendingCommissionUsd: number
  networkHealth: {
    activePercent: number
    inactivePercent: number
    suspendedPercent: number
  }
  leaderboard: Array<{
    rank: number
    userId: string
    name: string
    username: string | null
    avatarUrl: string | null
    country: string | null
    verified: boolean
    rankName: string
    activeInvestors: number
    teamVolumeUsd: number
    earnings: number
    trendPercent: string | null
  }>
  trends: {
    lifetime: string
    week: string
    month: string
    newInvestors: string
    teamVolume: string
    teamProfit: string
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function computeRank(activeInvestors: number): ReferralRank {
  const resolved = resolveReferralRank(activeInvestors)
  const atMaxRank = resolved.achieved !== null && resolved.achieved.key === resolved.next.key

  return {
    current: resolved.current.name,
    next: resolved.next.name,
    currentThreshold: resolved.achieved?.minMembers ?? 0,
    nextThreshold: resolved.next.minMembers,
    progressPercent: resolved.progressPercent,
    activeInvestors,
    membersRemaining: atMaxRank ? 0 : Math.max(0, resolved.next.minMembers - activeInvestors),
  }
}

function buildEarningsBreakdown(levelEarnings: Array<{ level: number; earnings: number }> = []) {
  const colors = ['#0052ff', '#7c3aed', '#10b981', '#f59e0b']
  const amounts = REFERRAL_PROFIT_SHARE_LEVELS.map(
    (levelConfig) => levelEarnings.find((row) => row.level === levelConfig.level)?.earnings ?? 0
  )
  const total = amounts.reduce((sum, amount) => sum + amount, 0)

  return REFERRAL_PROFIT_SHARE_LEVELS.map((levelConfig, index) => {
    const amount = amounts[index] ?? 0
    const value = total > 0 ? Math.round((amount / total) * 100) : 0

    return {
      name: `Level ${levelConfig.level}`,
      value,
      amount,
      color: colors[index] ?? '#94a3b8',
    }
  })
}

export function buildReferralProgramOverview(
  referrals: ReferralListItem[],
  totalReferrals: number,
  context: OverviewContext = {}
): ReferralProgramOverview {
  const activeInvestors =
    context.activeInvestors ?? referrals.filter((row) => row.status === 'Active').length
  const lifetimeEarnings =
    context.lifetimeEarningsOverride ??
    referrals.reduce((sum, row) => sum + row.commissionEarned, 0)
  const thisWeekEarnings = context.thisWeekEarnings ?? 0
  const thisMonthEarnings = context.thisMonthEarnings ?? 0
  const rank = computeRank(activeInvestors)

  const level1 = referrals.filter((row) => (row.networkLevel ?? 1) === 1)
  const level2 = referrals.filter((row) => row.networkLevel === 2)
  const level3 = referrals.filter((row) => row.networkLevel === 3)
  const level4 = referrals.filter((row) => row.networkLevel === 4)

  const levelItems = [level1, level2, level3, level4]
  const levelData = REFERRAL_PROFIT_SHARE_LEVELS.map((levelConfig, index) => {
    const items = levelItems[index] ?? []
    const realEarnings = context.levelEarnings?.find((row) => row.level === levelConfig.level)
      ?.earnings

    return {
      level: `Level ${levelConfig.level} (${formatReferralRate(levelConfig.rate)})`,
      items,
      earnings: realEarnings ?? 0,
    }
  })

  const teamVolumeUsd = context.teamVolumeUsd ?? referrals.reduce((sum, row) => sum + row.teamVolumeUsd, 0)
  const teamProfitUsd = context.teamProfitUsd ?? 0
  const pendingCommissionUsd = context.pendingCommissionUsd ?? 0

  const activeReferrals = referrals.filter((row) => row.status === 'Active').length
  const inactiveReferrals = referrals.filter((row) => row.status === 'Pending').length
  const suspendedReferrals = Math.max(0, referrals.length - activeReferrals - inactiveReferrals)
  const networkTotal = Math.max(referrals.length, 1)
  const activePercent = Math.round((activeReferrals / networkTotal) * 100)
  const inactivePercent = Math.round((inactiveReferrals / networkTotal) * 100)
  const suspendedPercent = Math.max(0, 100 - activePercent - inactivePercent)

  const healthScore = Math.min(
    100,
    Math.round(activePercent * 0.7 + Math.min(30, activeInvestors))
  )

  const recentActivities = referrals.slice(0, 5).map((referral) => ({
    id: referral.id,
    message:
      referral.status === 'Active'
        ? `${referral.name} made a deposit — you earned a commission`
        : `${referral.name} signed up using your referral link`,
    amount: formatCurrency(referral.commissionEarned),
    time: referral.joinedDate,
  }))

  const leaderboard = [...referrals]
    .sort((a, b) => b.commissionEarned - a.commissionEarned || b.teamVolumeUsd - a.teamVolumeUsd)
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.name,
      username: entry.username,
      avatarUrl: entry.avatarUrl,
      country: entry.country,
      verified: entry.verified,
      rankName: entry.rankName,
      activeInvestors: entry.status === 'Active' ? 1 : 0,
      teamVolumeUsd: entry.teamVolumeUsd,
      earnings: entry.commissionEarned,
      trendPercent: entry.trendPercent,
    }))

  const signups = Math.max(totalReferrals, 0)
  const conversionRate = signups > 0 ? Math.round((activeInvestors / signups) * 10000) / 100 : 0

  const priorWeek = context.periodTrends?.week
  const priorMonth = context.periodTrends?.month
  const priorLifetime = context.periodTrends?.lifetime

  const { badges, streak } = buildReferralBadgeState({
    activeInvestors,
    totalReferrals,
    thisMonthEarnings,
    referralDates: context.referralDates ?? [],
  })

  return {
    lifetimeEarnings,
    thisWeekEarnings,
    thisMonthEarnings,
    activeInvestors,
    totalReferrals,
    rank,
    healthScore,
    healthLabel:
      healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Needs attention',
    teamVolumeUsd,
    teamProfitUsd,
    pendingCommissionUsd,
    networkHealth: {
      activePercent,
      inactivePercent,
      suspendedPercent,
    },
    earningsTimeline: context.earningsTimeline ?? [],
    earningsBreakdown: buildEarningsBreakdown(context.levelEarnings),
    networkLevels: levelData.map(({ level, items, earnings }) => ({
      level,
      count: items.length,
      earnings,
      members: items.slice(0, 6).map((item) => ({
        id: item.id,
        name: item.name,
        initials: getInitials(item.name),
      })),
    })),
    channels: [],
    funnel: {
      clicks: signups,
      signups,
      activeInvestors,
      conversionRate,
    },
    recentActivities,
    badges,
    streak,
    achievements: REFERRAL_RANK_TIERS.map((tier) => ({
      id: tier.key,
      label: tier.name,
      minMembers: tier.minMembers,
      cashBonusUsd: tier.cashBonusUsd,
      perks: tier.perks,
      unlocked: activeInvestors >= tier.minMembers,
      membersRemaining: Math.max(0, tier.minMembers - activeInvestors),
    })),
    challenges: [
      {
        id: 'monthly-champion',
        title: 'Monthly Champion',
        progress: Math.min(activeInvestors, 5),
        target: 5,
        reward: '$50',
      },
      {
        id: 'network-expansion',
        title: 'Network Expansion',
        progress: Math.min(totalReferrals, 10),
        target: 10,
        reward: '$100 Bonus',
      },
    ],
    leaderboard,
    trends: {
      lifetime: priorLifetime ?? (lifetimeEarnings > 0 ? '+100%' : '+0%'),
      week: priorWeek ?? (thisWeekEarnings > 0 ? '+100%' : '+0%'),
      month: priorMonth ?? (thisMonthEarnings > 0 ? '+100%' : '+0%'),
      newInvestors: `+${Math.max(0, activeInvestors)} new`,
      teamVolume: context.teamVolumeTrend ?? '+0%',
      teamProfit: context.teamProfitTrend ?? '+0%',
    },
  }
}
