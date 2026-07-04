/**
 * UI-only referral commission copy for the Referral Center.
 * Does not affect backend calculations or payout logic.
 */

export const REFERRAL_DISPLAY_INVESTMENT_COMMISSION = '1.5%'

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
    label: 'On a $10,000 first investment',
  },
  weeklyProfitShare: {
    downlineProfit: 1_000,
    level1Earning: 30,
    label: 'If your L1 earns $1,000 profit this week',
  },
} as const
