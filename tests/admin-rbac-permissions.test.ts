import { describe, expect, it } from 'vitest'
import {
  assertDepositApprovalAccess,
  assertTransactionTypeApprovalAccess,
  assertWithdrawalApprovalAccess,
  canApproveDeposits,
  canApproveNonDepositTransactions,
  canApproveOrRejectTransactions,
  canApproveWithdrawals,
  DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE,
  DepositApprovalForbiddenError,
  isDepositTransactionType,
  isFinancialPortalAdminEmail,
  isPlatformOwnerEmail,
  isWithdrawalTransactionType,
  PLATFORM_OWNER_EMAIL,
  WithdrawalApprovalForbiddenError,
} from '@/lib/admin/transaction-approval-auth'
import {
  FULL_ADMIN_PORTAL_EMAIL,
  isAuthorizedAdminPortalEmail,
  isFullAdminPortalEmail,
  isSuperAdminEmail,
} from '@/lib/admin/super-admin'
import { canAccessModule, ADMIN_TIER_LABELS } from '@/lib/admin/permissions'
import type { AdminModule } from '@/lib/admin/types'

const OWNER = PLATFORM_OWNER_EMAIL
const SUPER = FULL_ADMIN_PORTAL_EMAIL
const STRANGER = 'random@example.com'

const ALL_MODULES: AdminModule[] = [
  'user_management',
  'financial_management',
  'investment_plan_management',
  'profit_and_payout_management',
  'kyc_aml_compliance',
  'notifications_communications',
  'primeai_management',
  'rewards_referral',
  'analytics_reporting',
  'market_content',
  'security_risk',
  'platform_configuration',
  'support_tickets',
  'audit_logs',
  'investment_management',
]

describe('RBAC — portal identity', () => {
  it('recognizes Platform Owner and Super Admin emails', () => {
    expect(isPlatformOwnerEmail(OWNER)).toBe(true)
    expect(isSuperAdminEmail(OWNER)).toBe(true)
    expect(isFullAdminPortalEmail(SUPER)).toBe(true)
    expect(isAuthorizedAdminPortalEmail(OWNER)).toBe(true)
    expect(isAuthorizedAdminPortalEmail(SUPER)).toBe(true)
    expect(isAuthorizedAdminPortalEmail(STRANGER)).toBe(false)
    expect(isFinancialPortalAdminEmail(OWNER)).toBe(true)
    expect(isFinancialPortalAdminEmail(SUPER)).toBe(true)
  })

  it('grants tier-1 module access for both portal admins (matrix)', () => {
    expect(ADMIN_TIER_LABELS[1]).toBeTruthy()
    for (const module of ALL_MODULES) {
      expect(canAccessModule(1, module)).toBe(true)
    }
  })
})

describe('RBAC — deposit vs withdrawal split', () => {
  it('Platform Owner can approve deposits and withdrawals', () => {
    expect(canApproveDeposits(OWNER)).toBe(true)
    expect(canApproveWithdrawals(OWNER)).toBe(true)
    expect(canApproveNonDepositTransactions(OWNER)).toBe(true)
    expect(canApproveOrRejectTransactions(OWNER)).toBe(true)
  })

  it('Super Admin can approve withdrawals but NOT deposits', () => {
    expect(canApproveWithdrawals(SUPER)).toBe(true)
    expect(canApproveNonDepositTransactions(SUPER)).toBe(true)
    expect(canApproveDeposits(SUPER)).toBe(false)
    expect(canApproveOrRejectTransactions(SUPER)).toBe(false)
  })

  it('strangers cannot approve either', () => {
    expect(canApproveDeposits(STRANGER)).toBe(false)
    expect(canApproveWithdrawals(STRANGER)).toBe(false)
  })

  it('classifies transaction types correctly', () => {
    expect(isDepositTransactionType('deposit')).toBe(true)
    expect(isDepositTransactionType('Bonus')).toBe(true)
    expect(isDepositTransactionType('profit')).toBe(true)
    expect(isDepositTransactionType('withdrawal')).toBe(false)
    expect(isWithdrawalTransactionType('withdrawal')).toBe(true)
    expect(isWithdrawalTransactionType('capital_return')).toBe(true)
  })
})

describe('RBAC — backend assert guards', () => {
  it('allows owner deposit assert; blocks Super Admin with exact 403 message', () => {
    expect(() => assertDepositApprovalAccess(OWNER)).not.toThrow()
    try {
      assertDepositApprovalAccess(SUPER)
      expect.unreachable('should throw')
    } catch (err) {
      expect(err).toBeInstanceOf(DepositApprovalForbiddenError)
      expect((err as DepositApprovalForbiddenError).statusCode).toBe(403)
      expect((err as Error).message).toBe(DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE)
      expect((err as Error).message).toBe("You don't have permission to approve deposits.")
    }
  })

  it('allows both portal admins to assert withdrawal approval', () => {
    expect(() => assertWithdrawalApprovalAccess(OWNER)).not.toThrow()
    expect(() => assertWithdrawalApprovalAccess(SUPER)).not.toThrow()
  })

  it('blocks stranger withdrawal assert', () => {
    expect(() => assertWithdrawalApprovalAccess(STRANGER)).toThrow(WithdrawalApprovalForbiddenError)
  })

  it('routes assertTransactionTypeApprovalAccess by type', () => {
    expect(() => assertTransactionTypeApprovalAccess(OWNER, 'deposit')).not.toThrow()
    expect(() => assertTransactionTypeApprovalAccess(SUPER, 'deposit')).toThrow(
      DepositApprovalForbiddenError
    )
    expect(() => assertTransactionTypeApprovalAccess(SUPER, 'withdrawal')).not.toThrow()
    expect(() => assertTransactionTypeApprovalAccess(OWNER, 'withdrawal')).not.toThrow()
  })
})

describe('RBAC — required verification matrix', () => {
  it('infojimvio@gmail.com — full unrestricted financial access', () => {
    expect(canApproveDeposits('infojimvio@gmail.com')).toBe(true)
    expect(canApproveWithdrawals('infojimvio@gmail.com')).toBe(true)
  })

  it('fxinvestprime@gmail.com — withdrawals yes, deposits no', () => {
    expect(canApproveWithdrawals('fxinvestprime@gmail.com')).toBe(true)
    expect(canApproveDeposits('fxinvestprime@gmail.com')).toBe(false)
    expect(() => assertDepositApprovalAccess('fxinvestprime@gmail.com')).toThrowError(
      /don't have permission to approve deposits/i
    )
    expect(() => assertWithdrawalApprovalAccess('fxinvestprime@gmail.com')).not.toThrow()
  })
})
