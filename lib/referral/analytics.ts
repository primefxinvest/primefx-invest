import { formatCurrency } from '@/lib/data/format'
import {
  REFERRAL_PROFIT_SHARE_LEVELS,
  REFERRAL_RANK_TIERS,
  formatReferralRate,
  resolveReferralRank,
} from '@/lib/referral/program-config'

export interface ReferralListItem {
  id: string
  name: string
  email: string
  status: string
  commissionEarned: number
  joinedDate: string
  tradingVolume: string
  networkLevel?: number
}

type OverviewContext = {
  lifetimeEarningsOverride?: number
  levelEarnings?: Array<{ level: number; earnings: number }>
  memberCount?: number
  activeInvestors?: number
}

export interface ReferralRank {
  current: string
  next: string
  currentThreshold: number
  nextThreshold: number
  progressPercent: number
  activeInvestors: number
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
  earningsChart: Array<{ month: string; earnings: number; potential: number }>
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
  achievements: Array<{ id: string; label: string; unlocked: boolean }>
  challenges: Array<{ id: string; title: string; progress: number; target: number; reward: string }>
  leaderboard: Array<{ rank: number; name: string; earnings: number }>
  trends: {
    lifetime: string
    week: string
    month: string
    newInvestors: string
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

function computeRank(memberCount: number): ReferralRank {
  const resolved = resolveReferralRank(memberCount)
  return {
    current: resolved.current.name,
    next: resolved.next.name,
    currentThreshold: resolved.current.minMembers,
    nextThreshold: resolved.next.minMembers,
    progressPercent: resolved.progressPercent,
    activeInvestors: memberCount,
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
      name: `Level ${levelConfig.level} Earnings`,
      value,
      amount,
      color: colors[index] ?? '#94a3b8',
    }
  })
}

function buildEarningsChart(total: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const weights = [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.1, 0.09, 0.09]
  let cumulative = 0

  return months.map((month, index) => {
    const earnings = Math.round(total * weights[index] * 10) / 10
    cumulative += earnings
    return {
      month,
      earnings: cumulative,
      potential: Math.round(cumulative * 1.18 * 100) / 100,
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
  const thisWeekEarnings = Math.round(lifetimeEarnings * 0.037 * 100) / 100
  const thisMonthEarnings = Math.round(lifetimeEarnings * 0.172 * 100) / 100
  const rank = computeRank(context.memberCount ?? totalReferrals)

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

  const healthScore = Math.min(
    100,
    Math.round(60 + activeInvestors * 2 + Math.min(20, lifetimeEarnings / 100))
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
    .sort((a, b) => b.commissionEarned - a.commissionEarned)
    .slice(0, 5)
    .map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      earnings: entry.commissionEarned,
    }))

  const clicks = Math.max(totalReferrals * 48, 120)
  const signups = Math.max(totalReferrals * 12, 24)
  const conversionRate = clicks > 0 ? Math.round((activeInvestors / clicks) * 10000) / 100 : 0

  return {
    lifetimeEarnings,
    thisWeekEarnings,
    thisMonthEarnings,
    activeInvestors,
    totalReferrals,
    rank,
    healthScore,
    healthLabel: healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : 'Fair',
    earningsChart: buildEarningsChart(Math.max(lifetimeEarnings, 100)),
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
    channels: [
      { name: 'WhatsApp', percent: 48, color: '#22c55e' },
      { name: 'Telegram', percent: 28, color: '#0052ff' },
      { name: 'Direct Link', percent: 15, color: '#7c3aed' },
      { name: 'Facebook', percent: 6, color: '#3b82f6' },
      { name: 'Other', percent: 3, color: '#94a3b8' },
    ],
    funnel: {
      clicks,
      signups,
      activeInvestors,
      conversionRate,
    },
    recentActivities,
    achievements: REFERRAL_RANK_TIERS.map((tier) => ({
      id: tier.key,
      label: tier.name,
      unlocked: activeInvestors >= tier.minMembers,
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
      lifetime: lifetimeEarnings > 0 ? '+24.5%' : '+0%',
      week: thisWeekEarnings > 0 ? '+18.7%' : '+0%',
      month: thisMonthEarnings > 0 ? '+32.4%' : '+0%',
      newInvestors: `+${Math.max(0, activeInvestors - 1)} new`,
    },
  }
}
