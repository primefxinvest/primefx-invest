/** PrimeFx Invest — referral program terms (single source of truth). */

/** One-time commission on a referred member's first deposit or investment. */
export const REFERRAL_INVESTMENT_COMMISSION_RATE = 0.02

/** Profit-share commissions accrue daily but pay on weekly distribution (Friday batch). */
export const REFERRAL_COMMISSION_WEEKLY_PAYOUT = true

export const REFERRAL_PROFIT_SHARE_LEVELS = [
  { level: 1, label: 'L1', rate: 0.05, description: '5% of profits every week' },
  { level: 2, label: 'L2', rate: 0.02, description: '2% of profits every week' },
  { level: 3, label: 'L3', rate: 0.01, description: '1% of profits every week' },
  { level: 4, label: 'L4', rate: 0.005, description: '0.5% of profits every week' },
] as const

/** Ambassador override: % of all downline profits every week. */
export const AMBASSADOR_TEAM_PROFIT_RATE = 0.005

export const REFERRAL_RANK_TIERS = [
  {
    key: 'bronze',
    name: 'PrimeFx Bronze',
    minMembers: 50,
    cashBonusUsd: 150,
    perks: [] as string[],
  },
  {
    key: 'silver',
    name: 'PrimeFx Silver',
    minMembers: 100,
    cashBonusUsd: 300,
    perks: [] as string[],
  },
  {
    key: 'gold',
    name: 'PrimeFx Gold',
    minMembers: 300,
    cashBonusUsd: 800,
    perks: [] as string[],
  },
  {
    key: 'platinum',
    name: 'PrimeFx Platinum',
    minMembers: 500,
    cashBonusUsd: 1500,
    perks: [] as string[],
  },
  {
    key: 'diamond',
    name: 'PrimeFx Diamond',
    minMembers: 1000,
    cashBonusUsd: 2000,
    perks: ['3-day vacation trip (Asia or Europe)'],
  },
  {
    key: 'ambassador',
    name: 'PrimeFx Ambassador',
    minMembers: 2500,
    cashBonusUsd: 0,
    perks: [
      'Company car',
      'AcademyFx office',
      '$1,000 monthly salary',
      '0.5% of all team profits every week',
    ],
  },
] as const

export type ReferralRankKey = (typeof REFERRAL_RANK_TIERS)[number]['key']

/** Shown in UI when active member count is below the first rank threshold. */
export const REFERRAL_UNRANKED = {
  key: 'none' as const,
  name: 'No rank yet',
  minMembers: 0,
  cashBonusUsd: 0,
  perks: [] as string[],
}

export function getReferralRankTier(key: string) {
  return REFERRAL_RANK_TIERS.find((tier) => tier.key === key)
}

export const PLATFORM_FEE_RATES = {
  p2pTransfer: 0.012,
  withdrawal: 0.05,
} as const

export const WITHDRAWAL_NOTICE_DAYS = 7

export const TRADING_ASSET = 'XAU/USD'

export function formatReferralRate(rate: number): string {
  const percent = rate * 100
  const rounded = Math.round(percent * 10000) / 10000
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded}%`
}

export function getProfitShareRate(level: number): number {
  return REFERRAL_PROFIT_SHARE_LEVELS.find((row) => row.level === level)?.rate ?? 0
}

export function getMaxProfitShareRate(): number {
  return REFERRAL_PROFIT_SHARE_LEVELS[0]?.rate ?? 0
}

export function formatProfitShareLevelsSummary(): string {
  return REFERRAL_PROFIT_SHARE_LEVELS.map(
    (row) => `${row.label}: ${formatReferralRate(row.rate)}`
  ).join(' · ')
}

export function resolveReferralRank(activeMemberCount: number) {
  let achieved: (typeof REFERRAL_RANK_TIERS)[number] | null = null
  for (const tier of REFERRAL_RANK_TIERS) {
    if (activeMemberCount >= tier.minMembers) {
      achieved = tier
    }
  }

  const achievedIndex = achieved
    ? REFERRAL_RANK_TIERS.findIndex((tier) => tier.key === achieved!.key)
    : -1
  const next =
    achievedIndex < 0
      ? REFERRAL_RANK_TIERS[0]
      : REFERRAL_RANK_TIERS[Math.min(achievedIndex + 1, REFERRAL_RANK_TIERS.length - 1)]

  const progressFrom = achieved?.minMembers ?? 0
  const span = Math.max(1, next.minMembers - progressFrom)
  const progressPercent =
    achieved && achieved.key === next.key
      ? 100
      : Math.min(100, Math.round(((activeMemberCount - progressFrom) / span) * 100))

  return {
    achieved,
    achievedKey: achieved?.key ?? null,
    current: achieved ?? REFERRAL_UNRANKED,
    next,
    progressPercent,
    activeMembers: activeMemberCount,
    hasRank: achieved !== null,
  }
}
