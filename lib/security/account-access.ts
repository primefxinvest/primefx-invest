import 'server-only'

/** Financial actions blocked for non-active account statuses. */
export const BLOCKED_ACCOUNT_STATUSES = new Set([
  'suspended',
  'banned',
  'restricted',
  'frozen',
  'under_review',
  'under-review',
  'review',
  'closed',
  'blocked',
  'inactive',
])

export type FinancialAccountAction =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'referral'
  | 'investment'
  | 'payout'

const ACTION_MESSAGES: Record<FinancialAccountAction, string> = {
  deposit: 'Deposits are unavailable while your account is under review or restricted.',
  withdrawal: 'Withdrawals are unavailable while your account is under review or restricted.',
  transfer: 'Transfers are unavailable while your account is under review or restricted.',
  referral: 'Referral program access is unavailable while your account is under review or restricted.',
  investment: 'New investments are unavailable while your account is under review or restricted.',
  payout: 'Payout requests are unavailable while your account is under review or restricted.',
}

export function normalizeAccountStatus(status: string | null | undefined): string {
  return String(status ?? 'active')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export function isAccountStatusFinanciallyBlocked(status: string | null | undefined): boolean {
  const normalized = normalizeAccountStatus(status)
  if (normalized === 'active') return false
  return BLOCKED_ACCOUNT_STATUSES.has(normalized)
}

export function getFinancialActionBlockMessage(action: FinancialAccountAction): string {
  return ACTION_MESSAGES[action]
}

export type AccountAccessResult =
  | { allowed: true; accountStatus: string }
  | { allowed: false; error: string; accountStatus: string }

export function evaluateAccountFinancialAccess(
  accountStatus: string | null | undefined,
  action: FinancialAccountAction
): AccountAccessResult {
  const normalized = normalizeAccountStatus(accountStatus)

  if (isAccountStatusFinanciallyBlocked(accountStatus)) {
    return {
      allowed: false,
      error: getFinancialActionBlockMessage(action),
      accountStatus: normalized,
    }
  }

  return { allowed: true, accountStatus: normalized }
}
