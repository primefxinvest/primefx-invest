/**
 * UI-only Rewards page copy and display tiers.
 * Does not affect backend calculations, payouts, or rank logic.
 */

import { REFERRAL_RANK_TIERS } from '@/lib/referral/program-config'

export const REWARDS_RANK_JOURNEY = [
  { key: 'bronze', label: 'Bronze', bonus: '$150', profitShare: '0.5%', minMembers: 50 },
  { key: 'silver', label: 'Silver', bonus: '$300', profitShare: '0.75%', minMembers: 100 },
  { key: 'gold', label: 'Gold', bonus: '$800', profitShare: '1%', minMembers: 300 },
  { key: 'platinum', label: 'Platinum', bonus: '$1,500', profitShare: '1.25%', minMembers: 500 },
  { key: 'diamond', label: 'Diamond', bonus: '$3,000', profitShare: '1.5%', minMembers: 1000 },
  { key: 'ambassador', label: 'Ambassador', bonus: '$10,000', profitShare: '2%', minMembers: 2500 },
] as const

export const REWARDS_RANK_CARDS = [
  {
    key: 'bronze',
    label: 'Bronze',
    bonus: '$150 Bonus',
    perks: ['Bronze Badge', 'Leaderboard Access'],
  },
  {
    key: 'silver',
    label: 'Silver',
    bonus: '$300 Bonus',
    perks: ['Silver Badge', 'Advanced Analytics'],
  },
  {
    key: 'gold',
    label: 'Gold',
    bonus: '$800 Bonus',
    perks: ['Gold Badge', 'Priority Support'],
  },
  {
    key: 'platinum',
    label: 'Platinum',
    bonus: '$1,500 Bonus',
    perks: ['VIP Support', 'Premium Campaign Access'],
  },
  {
    key: 'diamond',
    label: 'Diamond',
    bonus: '$3,000 Bonus',
    perks: ['VIP Community', 'Exclusive Opportunities'],
  },
  {
    key: 'ambassador',
    label: 'Ambassador',
    bonus: '$10,000 Bonus',
    perks: ['Lifetime VIP Status', 'Global Recognition'],
  },
] as const

export const REWARDS_MILESTONES = [
  { referrals: 10, reward: '$50', label: '10 referrals' },
  { referrals: 25, reward: '$100', label: '25 referrals' },
  { referrals: 50, reward: '$250', label: '50 referrals' },
  { referrals: 100, reward: '$500', label: '100 referrals' },
  { referrals: 500, reward: '$2,000', label: '500 referrals' },
] as const

export const REWARDS_AVAILABLE_ITEMS = [
  { id: 'cash', title: 'Cash Bonus', rank: 'Rank milestone', status: 'locked' as const },
  { id: 'trading', title: 'Trading Bonus', rank: 'Silver Rank', status: 'locked' as const },
  { id: 'support', title: 'Premium Support', rank: 'Gold Rank', status: 'locked' as const },
  { id: 'vip', title: 'VIP Badge', rank: 'Platinum Rank', status: 'locked' as const },
  { id: 'campaign', title: 'Exclusive Campaign Access', rank: 'Platinum Rank', status: 'locked' as const },
  { id: 'withdrawals', title: 'Priority Withdrawals', rank: 'Diamond Rank', status: 'locked' as const },
  { id: 'community', title: 'Private Community Access', rank: 'Diamond Rank', status: 'locked' as const },
  { id: 'ambassador', title: 'Ambassador Perks', rank: 'Ambassador Rank', status: 'locked' as const },
] as const

export const REWARDS_FAQ = [
  {
    q: 'How do I earn rewards?',
    a: 'Complete achievements, grow your referral network, and reach rank milestones to unlock cash bonuses, badges, and premium benefits.',
  },
  {
    q: 'When are rank bonuses paid?',
    a: 'Rank bonuses are credited after you meet active investor requirements and pass verification. Track status in Reward History.',
  },
  {
    q: 'Can I withdraw reward earnings?',
    a: 'Yes. Available rewards move to your wallet balance and can be withdrawn via crypto on the Payouts page.',
  },
  {
    q: 'What is the difference between XP and cash rewards?',
    a: 'XP tracks your investor tier progress. Cash rewards and rank bonuses are paid in USDT to your wallet.',
  },
] as const

export function mapTierToRankKey(tierName: string): string {
  const normalized = tierName.toLowerCase().replace(/\s+level/i, '').trim()
  const match = REFERRAL_RANK_TIERS.find((t) => t.key === normalized)
  return match?.key ?? 'bronze'
}

export function rankIndex(key: string) {
  return REWARDS_RANK_JOURNEY.findIndex((r) => r.key === key)
}
