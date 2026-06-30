/** PrimeFx Invest — referral program terms (single source of truth). */

export const REFERRAL_PROFIT_SHARE_LEVELS = [
  { level: 1, label: 'L1', rate: 0.05, description: '5% of profits every week' },
  { level: 2, label: 'L2', rate: 0.02, description: '2% of profits every week' },
  { level: 3, label: 'L3', rate: 0.01, description: '1% of profits every week' },
  { level: 4, label: 'L4', rate: 0.005, description: '0.5% of profits every week' },
] as const

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

export const PLATFORM_FEE_RATES = {
  p2pTransfer: 0.012,
  withdrawal: 0.05,
} as const

export const WITHDRAWAL_NOTICE_DAYS = 7

export const TRADING_ASSET = 'XAU/USD'

export function getProfitShareRate(level: number): number {
  return REFERRAL_PROFIT_SHARE_LEVELS.find((row) => row.level === level)?.rate ?? 0
}

export function resolveReferralRank(activeMembers: number) {
  let current: (typeof REFERRAL_RANK_TIERS)[number] = REFERRAL_RANK_TIERS[0]
  for (const tier of REFERRAL_RANK_TIERS) {
    if (activeMembers >= tier.minMembers) {
      current = tier
    }
  }

  const currentIndex = REFERRAL_RANK_TIERS.findIndex((tier) => tier.key === current.key)
  const next = REFERRAL_RANK_TIERS[Math.min(currentIndex + 1, REFERRAL_RANK_TIERS.length - 1)]
  const span = Math.max(1, next.minMembers - current.minMembers)
  const progressPercent =
    current.key === next.key
      ? 100
      : Math.min(100, Math.round(((activeMembers - current.minMembers) / span) * 100))

  return {
    current,
    next,
    progressPercent,
    activeMembers,
  }
}
