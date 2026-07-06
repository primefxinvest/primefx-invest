/**
 * UI-only referral commission copy for the Referral Center.
 * Does not affect backend calculations or payout logic.
 */

import {
  REFERRAL_INVESTMENT_COMMISSION_RATE,
  REFERRAL_PROFIT_SHARE_LEVELS,
  formatReferralRate,
} from '@/lib/referral/program-config'

export const REFERRAL_DISPLAY_INVESTMENT_COMMISSION = formatReferralRate(
  REFERRAL_INVESTMENT_COMMISSION_RATE
)

export const REFERRAL_DISPLAY_PROFIT_SHARE = REFERRAL_PROFIT_SHARE_LEVELS.map((row) => ({
  level: row.level,
  label: row.label,
  rate: formatReferralRate(row.rate),
}))

export const REFERRAL_DISPLAY_PROFIT_SHARE_SUMMARY = REFERRAL_DISPLAY_PROFIT_SHARE.map(
  (row) => `${row.label} → ${row.rate}`
).join(' · ')

export const REFERRAL_DISPLAY_MAX_WEEKLY_SHARE = formatReferralRate(
  REFERRAL_PROFIT_SHARE_LEVELS[0]?.rate ?? 0.05
)

const EXAMPLE_DEPOSIT = 10_000
const EXAMPLE_WEEKLY_PROFIT = 10_000

/** Example earnings for transparency cards (illustrative only). */
export const REFERRAL_EARNINGS_EXAMPLES = {
  investmentCommission: {
    deposit: EXAMPLE_DEPOSIT,
    commission: EXAMPLE_DEPOSIT * REFERRAL_INVESTMENT_COMMISSION_RATE,
    label: '$10,000 deposit',
  },
  weeklyProfitShare: {
    downlineProfit: EXAMPLE_WEEKLY_PROFIT,
    level1Earning: EXAMPLE_WEEKLY_PROFIT * (REFERRAL_PROFIT_SHARE_LEVELS[0]?.rate ?? 0.05),
    label: '$10,000 weekly profit generated',
  },
} as const

const NETWORK_LEVEL_META = [
  {
    title: 'Direct Referrals',
    description: 'People you personally invite.',
    color: '#0052ff',
  },
  {
    title: 'Second Level Referrals',
    description: 'People invited by your Level 1 members.',
    color: '#10b981',
  },
  {
    title: 'Third Level Referrals',
    description: 'People invited by Level 2 members.',
    color: '#f97316',
  },
  {
    title: 'Fourth Level Referrals',
    description: 'People invited by Level 3 members.',
    color: '#8b5cf6',
  },
] as const

/** UI-only network level copy for timeline section. */
export const REFERRAL_NETWORK_LEVELS = REFERRAL_PROFIT_SHARE_LEVELS.map((levelConfig, index) => {
  const meta = NETWORK_LEVEL_META[index] ?? NETWORK_LEVEL_META[0]
  return {
    level: levelConfig.level,
    title: meta.title,
    description: meta.description,
    rate: formatReferralRate(levelConfig.rate),
    exampleProfit: EXAMPLE_WEEKLY_PROFIT,
    exampleEarning: EXAMPLE_WEEKLY_PROFIT * levelConfig.rate,
    color: meta.color,
  }
})

/** UI-only trust cards for transparency footer. */
export const REFERRAL_TRUST_CARDS = [
  {
    title: 'Transparent System',
    body: 'Every commission rate and payout is disclosed upfront in your dashboard.',
  },
  {
    title: 'Secure & Verified',
    body: 'Rewards require verified investment activity — never paid memberships.',
  },
  {
    title: 'No Hidden Fees',
    body: 'No recruitment fees, starter kits, or surprise deductions from earnings.',
  },
  {
    title: 'Fair & Sustainable',
    body: 'Built for long-term investor relationships, not unsustainable hype cycles.',
  },
] as const
