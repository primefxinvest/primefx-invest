/**
 * UI-only rank benefits matrix for Rank Benefits page.
 * Does not affect backend rank logic or payouts.
 */

import { REFERRAL_RANK_TIERS } from '@/lib/referral/program-config'

export type RankBenefitRow = {
  key: string
  label: string
  values: Record<string, string | boolean>
}

export const REFERRAL_RANK_BENEFIT_COLUMNS = REFERRAL_RANK_TIERS.map((tier) => ({
  key: tier.key,
  label: tier.name.replace(/^PrimeFx\s+/i, ''),
  minMembers: tier.minMembers,
}))

/** Display-only weekly profit share by rank (UI copy). */
const WEEKLY_SHARE: Record<string, string> = {
  bronze: '1%',
  silver: '1.5%',
  gold: '2%',
  platinum: '3%',
  diamond: '4%',
  ambassador: '6%',
}

function cell(values: Record<string, string | boolean>, keys: string[], value: string | boolean) {
  keys.forEach((key) => {
    values[key] = value
  })
}

function buildBenefitRows(): RankBenefitRow[] {
  const bronzeUp = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'ambassador']
  const silverUp = bronzeUp.slice(1)
  const goldUp = bronzeUp.slice(2)
  const platinumUp = bronzeUp.slice(3)
  const diamondUp = bronzeUp.slice(4)
  const ambassadorOnly = ['ambassador']

  const rows: RankBenefitRow[] = []

  const badge: RankBenefitRow = { key: 'badge', label: 'Rank Badge', values: {} }
  cell(badge.values, bronzeUp, true)
  rows.push(badge)

  const bonus: RankBenefitRow = { key: 'bonus', label: 'One-time Rank Bonus', values: {} }
  REFERRAL_RANK_TIERS.forEach((tier) => {
    bonus.values[tier.key] =
      tier.cashBonusUsd > 0 ? `$${tier.cashBonusUsd.toLocaleString()}` : '—'
  })
  rows.push(bonus)

  const share: RankBenefitRow = { key: 'share', label: 'Weekly Profit Share', values: {} }
  REFERRAL_RANK_TIERS.forEach((tier) => {
    share.values[tier.key] = WEEKLY_SHARE[tier.key] ?? '—'
  })
  rows.push(share)

  const vipSupport: RankBenefitRow = { key: 'vip', label: 'VIP Support', values: {} }
  cell(vipSupport.values, ['bronze'], 'Standard')
  cell(vipSupport.values, ['silver', 'gold'], 'Priority')
  cell(vipSupport.values, platinumUp, 'VIP')
  rows.push(vipSupport)

  const accountManager: RankBenefitRow = { key: 'manager', label: 'Dedicated Account Manager', values: {} }
  cell(accountManager.values, diamondUp, true)
  rows.push(accountManager)

  const analytics: RankBenefitRow = { key: 'analytics', label: 'Advanced Analytics', values: {} }
  cell(analytics.values, silverUp, true)
  rows.push(analytics)

  const events: RankBenefitRow = { key: 'events', label: 'VIP Events Access', values: {} }
  cell(events.values, goldUp, true)
  rows.push(events)

  const withdrawals: RankBenefitRow = { key: 'withdrawals', label: 'Priority Withdrawals', values: {} }
  cell(withdrawals.values, platinumUp, true)
  rows.push(withdrawals)

  const executive: RankBenefitRow = { key: 'executive', label: 'Executive Bonuses', values: {} }
  cell(executive.values, diamondUp, true)
  rows.push(executive)

  const car: RankBenefitRow = { key: 'car', label: 'Car Bonus / Allowance', values: {} }
  cell(car.values, ambassadorOnly, true)
  rows.push(car)

  const trip: RankBenefitRow = { key: 'trip', label: 'Luxury Trip', values: {} }
  cell(trip.values, ['diamond'], true)
  cell(trip.values, ambassadorOnly, true)
  rows.push(trip)

  const recognition: RankBenefitRow = { key: 'recognition', label: 'Global Recognition', values: {} }
  cell(recognition.values, ambassadorOnly, true)
  rows.push(recognition)

  return rows
}

export const REFERRAL_RANK_BENEFIT_ROWS = buildBenefitRows()
