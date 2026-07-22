import { FULL_ADMIN_PORTAL_EMAIL } from './super-admin-emails'

/**
 * Platform Owner — sole authority for deposit approve / reject / credit / complete.
 * Also has full withdrawal and owner-only controls.
 */
export const PLATFORM_OWNER_EMAIL = 'infojimvio@gmail.com'

/** @deprecated Use PLATFORM_OWNER_EMAIL — kept for existing imports. */
export const TRANSACTION_APPROVAL_ADMIN_EMAIL = PLATFORM_OWNER_EMAIL

/** Display label for the Finance Admin portal account (effective tier-1 module access). */
export const FINANCE_ADMIN_ROLE_LABEL = 'Finance Admin'

export const DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE =
  "You don't have permission to approve deposits."

export const WITHDRAWAL_APPROVAL_FORBIDDEN_MESSAGE =
  'You do not have permission to approve or reject withdrawals.'

export const TRANSACTION_APPROVAL_FORBIDDEN_MESSAGE = DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

export function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === PLATFORM_OWNER_EMAIL.toLowerCase()
}

/** @deprecated Prefer isPlatformOwnerEmail */
export function isTransactionApprovalAdminEmail(email: string | null | undefined): boolean {
  return isPlatformOwnerEmail(email)
}

export function isFullPortalAdminEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === FULL_ADMIN_PORTAL_EMAIL.toLowerCase()
}

/** Either authorized portal admin (owner or full portal). */
export function isFinancialPortalAdminEmail(email: string | null | undefined): boolean {
  return isPlatformOwnerEmail(email) || isFullPortalAdminEmail(email)
}

/** Deposit approve / reject / credit / complete — Platform Owner only. */
export function canApproveDeposits(email: string | null | undefined): boolean {
  return isPlatformOwnerEmail(email)
}

/**
 * Withdrawal approve / reject / mark paid — Platform Owner and Super Admin (full portal).
 */
export function canApproveWithdrawals(email: string | null | undefined): boolean {
  return isFinancialPortalAdminEmail(email)
}

/**
 * Non-deposit transaction mutations (e.g. withdrawal rows in Transactions view).
 * Same gate as withdrawals.
 */
export function canApproveNonDepositTransactions(email: string | null | undefined): boolean {
  return canApproveWithdrawals(email)
}

/**
 * @deprecated Ambiguous — previously meant "any financial mutation".
 * Now aliases deposit approval (owner-only) for backward-compatible call sites
 * that still treat this as the strictest gate. Prefer canApproveDeposits /
 * canApproveWithdrawals.
 */
export function canApproveOrRejectTransactions(email: string | null | undefined): boolean {
  return canApproveDeposits(email)
}

export function isDepositTransactionType(type: string | null | undefined): boolean {
  const t = String(type ?? '').toLowerCase()
  return t === 'deposit' || t === 'bonus' || t === 'profit'
}

export function isWithdrawalTransactionType(type: string | null | undefined): boolean {
  const t = String(type ?? '').toLowerCase()
  return t === 'withdrawal' || t === 'capital_return' || t === 'capital return'
}

export class DepositApprovalForbiddenError extends Error {
  readonly statusCode = 403

  constructor(message = DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE) {
    super(message)
    this.name = 'DepositApprovalForbiddenError'
  }
}

export class WithdrawalApprovalForbiddenError extends Error {
  readonly statusCode = 403

  constructor(message = WITHDRAWAL_APPROVAL_FORBIDDEN_MESSAGE) {
    super(message)
    this.name = 'WithdrawalApprovalForbiddenError'
  }
}

/** @deprecated Prefer DepositApprovalForbiddenError */
export class TransactionApprovalForbiddenError extends DepositApprovalForbiddenError {
  constructor(message = DEPOSIT_APPROVAL_FORBIDDEN_MESSAGE) {
    super(message)
    this.name = 'TransactionApprovalForbiddenError'
  }
}

export function assertDepositApprovalAccess(email: string | null | undefined): void {
  if (!canApproveDeposits(email)) {
    throw new DepositApprovalForbiddenError()
  }
}

export function assertWithdrawalApprovalAccess(email: string | null | undefined): void {
  if (!canApproveWithdrawals(email)) {
    throw new WithdrawalApprovalForbiddenError()
  }
}

/** Assert permission for a specific transaction type mutation. */
export function assertTransactionTypeApprovalAccess(
  email: string | null | undefined,
  type: string | null | undefined
): void {
  if (isDepositTransactionType(type)) {
    assertDepositApprovalAccess(email)
    return
  }
  assertWithdrawalApprovalAccess(email)
}

/** @deprecated Prefer assertDepositApprovalAccess */
export function assertTransactionApprovalAccess(email: string | null | undefined): void {
  assertDepositApprovalAccess(email)
}
