import { describe, expect, it } from 'vitest'
import { computeWithdrawalRiskScore, formatRiskScoreLabel } from '@/lib/admin/withdrawal-risk'
import {
  canAdminApproveWithdrawal,
  isWithdrawalOnHold,
  matchesWithdrawalAdminFilter,
} from '@/lib/wallet/withdrawal-status'
import { isEmailVerified } from '@/lib/auth/require-verified-email'

describe('registration email verification', () => {
  it('treats unverified users as not verified', () => {
    expect(isEmailVerified({ email_confirmed_at: null })).toBe(false)
  })

  it('treats confirmed users as verified', () => {
    expect(isEmailVerified({ email_confirmed_at: '2026-01-01T00:00:00Z' })).toBe(true)
  })
})

describe('withdrawal admin filters', () => {
  it('matches locked withdrawals', () => {
    expect(matchesWithdrawalAdminFilter('pending_notice', 'pending_hold')).toBe(true)
    expect(matchesWithdrawalAdminFilter('ready', 'pending_hold')).toBe(false)
  })

  it('detects hold state', () => {
    expect(isWithdrawalOnHold('pending_notice')).toBe(true)
    expect(isWithdrawalOnHold('ready')).toBe(false)
  })

  it('requires ready status and elapsed available date for approval', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(canAdminApproveWithdrawal({ status: 'ready', availableAt: past })).toBe(true)
    expect(canAdminApproveWithdrawal({ status: 'pending_notice', availableAt: past })).toBe(false)
  })
})

describe('withdrawal risk scoring', () => {
  it('scores higher risk for unverified KYC and email', () => {
    const high = computeWithdrawalRiskScore({
      kyc_status: 'Pending',
      email_verified: false,
      account_status: 'active',
      amount_usd: 12_000,
      referral_status: 'Active',
    })
    const low = computeWithdrawalRiskScore({
      kyc_status: 'Verified',
      email_verified: true,
      account_status: 'active',
      amount_usd: 100,
      referral_status: 'Active',
    })
    expect(high).toBeGreaterThan(low)
    expect(formatRiskScoreLabel(high)).toBe('High')
    expect(formatRiskScoreLabel(low)).toBe('Low')
  })
})
