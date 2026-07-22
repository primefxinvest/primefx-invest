import { describe, expect, it } from 'vitest'
import { computeWithdrawalRiskScore, formatRiskScoreLabel } from '@/lib/admin/withdrawal-risk'
import {
  canAdminApproveWithdrawal,
  canAdminMarkWithdrawalPaid,
  formatWithdrawalDisplayStatus,
  isWithdrawalOnHold,
  matchesWithdrawalAdminFilter,
} from '@/lib/wallet/withdrawal-status'
import { isEmailVerified } from '@/lib/auth/require-verified-email'
import { getWithdrawalTimelineSteps } from '@/lib/wallet/withdrawal-timeline'
import { validateWithdrawAddress, WITHDRAW_NETWORKS_BY_ASSET } from '@/lib/payments/withdraw-networks'
import { calculateDisplayWithdrawalReceive } from '@/lib/fees/display'

describe('registration email verification', () => {
  it('treats unverified users as not verified', () => {
    expect(isEmailVerified({ email_confirmed_at: undefined })).toBe(false)
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

  it('matches pending review queue', () => {
    expect(matchesWithdrawalAdminFilter('pending', 'ready_for_payout')).toBe(true)
    expect(matchesWithdrawalAdminFilter('ready', 'ready_for_payout')).toBe(true)
  })

  it('detects hold state', () => {
    expect(isWithdrawalOnHold('pending_notice')).toBe(true)
    expect(isWithdrawalOnHold('pending')).toBe(false)
    expect(isWithdrawalOnHold('ready')).toBe(false)
  })

  it('allows immediate approval for pending review', () => {
    expect(canAdminApproveWithdrawal({ status: 'pending' })).toBe(true)
    expect(canAdminApproveWithdrawal({ status: 'pending_notice', availableAt: new Date().toISOString() })).toBe(false)
  })

  it('requires ready status and elapsed available date for legacy approval', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(canAdminApproveWithdrawal({ status: 'ready', availableAt: past })).toBe(true)
  })

  it('allows mark as paid only after approval', () => {
    expect(canAdminMarkWithdrawalPaid({ status: 'approved' })).toBe(true)
    expect(canAdminMarkWithdrawalPaid({ status: 'pending' })).toBe(false)
    expect(canAdminMarkWithdrawalPaid({ status: 'completed' })).toBe(false)
  })
})

describe('withdrawal display status', () => {
  it('maps pending to Pending Review and completed to Paid', () => {
    expect(formatWithdrawalDisplayStatus('pending')).toBe('Pending Review')
    expect(formatWithdrawalDisplayStatus('completed')).toBe('Paid')
    expect(formatWithdrawalDisplayStatus('approved')).toBe('Approved')
  })
})

describe('withdrawal timeline', () => {
  it('shows pending → approved → paid for modern flow', () => {
    const pending = getWithdrawalTimelineSteps({ status: 'pending' })
    expect(pending.find((s) => s.key === 'review')?.state).toBe('active')

    const approved = getWithdrawalTimelineSteps({ status: 'approved' })
    expect(approved.find((s) => s.key === 'approved')?.state).toBe('active')

    const paid = getWithdrawalTimelineSteps({ status: 'completed' })
    expect(paid.find((s) => s.key === 'completed')?.state).toBe('done')
  })
})

describe('withdrawal validation', () => {
  it('validates TRC20 addresses', () => {
    const network = WITHDRAW_NETWORKS_BY_ASSET.USDT.find((n) => n.id === 'TRC20')!
    expect(validateWithdrawAddress('TFoJtYdQvLm2vCyvXFPLTyxBJ6aTnKvbNe', network).valid).toBe(true)
    expect(validateWithdrawAddress('0x123', network).valid).toBe(false)
  })

  it('computes display receive amount', () => {
    const fees = calculateDisplayWithdrawalReceive(200, 'TRC20')
    expect(fees.youWillReceiveUsd).toBe(197.5)
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
