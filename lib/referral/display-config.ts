/**
 * UI-only referral commission copy for the Referral Center.
 * Does not affect backend calculations or payout logic.
 */

export const REFERRAL_DISPLAY_INVESTMENT_COMMISSION = '3%'

export const REFERRAL_DISPLAY_PROFIT_SHARE = [
  { level: 1, label: 'L1', rate: '3%' },
  { level: 2, label: 'L2', rate: '1%' },
  { level: 3, label: 'L3', rate: '0.5%' },
  { level: 4, label: 'L4', rate: '0.25%' },
] as const

export const REFERRAL_DISPLAY_PROFIT_SHARE_SUMMARY = REFERRAL_DISPLAY_PROFIT_SHARE.map(
  (row) => `${row.label} → ${row.rate}`
).join(' · ')

export const REFERRAL_DISPLAY_MAX_WEEKLY_SHARE = '3%'

/** Example earnings for transparency cards (illustrative only). */
export const REFERRAL_EARNINGS_EXAMPLES = {
  investmentCommission: {
    deposit: 10_000,
    commission: 150,
    label: '$10,000 deposit',
  },
  weeklyProfitShare: {
    downlineProfit: 10_000,
    level1Earning: 300,
    label: '$10,000 weekly profit generated',
  },
} as const

/** UI-only network level copy for timeline section. */
export const REFERRAL_NETWORK_LEVELS = [
  {
    level: 1,
    title: 'Direct Referrals',
    description: 'People you personally invite.',
    rate: '3%',
    exampleProfit: 10_000,
    exampleEarning: 300,
    color: '#0052ff',
  },
  {
    level: 2,
    title: 'Second Level Referrals',
    description: 'People invited by your Level 1 members.',
    rate: '1%',
    exampleProfit: 10_000,
    exampleEarning: 100,
    color: '#10b981',
  },
  {
    level: 3,
    title: 'Third Level Referrals',
    description: 'People invited by Level 2 members.',
    rate: '0.5%',
    exampleProfit: 10_000,
    exampleEarning: 50,
    color: '#f97316',
  },
  {
    level: 4,
    title: 'Fourth Level Referrals',
    description: 'People invited by Level 3 members.',
    rate: '0.25%',
    exampleProfit: 10_000,
    exampleEarning: 25,
    color: '#8b5cf6',
  },
] as const

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
