import type { AdminWithdrawalQueueRow } from '@/lib/admin/queries'

export function computeWithdrawalRiskScore(row: Pick<
  AdminWithdrawalQueueRow,
  'kyc_status' | 'email_verified' | 'account_status' | 'amount_usd' | 'referral_status'
>): number {
  let score = 0

  const kyc = String(row.kyc_status ?? '').toLowerCase()
  if (kyc !== 'verified') score += 35
  if (!row.email_verified) score += 25

  const accountStatus = String(row.account_status ?? 'active').toLowerCase()
  if (accountStatus !== 'active') score += 40

  if (row.amount_usd >= 10_000) score += 20
  else if (row.amount_usd >= 5_000) score += 10
  else if (row.amount_usd >= 1_000) score += 5

  const referral = String(row.referral_status ?? '').toLowerCase()
  if (referral === 'suspended' || referral === 'disabled') score += 10

  return Math.min(100, score)
}

export function formatRiskScoreLabel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 60) return 'High'
  if (score >= 30) return 'Medium'
  return 'Low'
}

export function riskScoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 60) return 'danger'
  if (score >= 30) return 'warning'
  return 'success'
}
