export type KycStatus = 'verified' | 'pending' | 'rejected'

export type FinancialAction =
  | 'deposit'
  | 'withdrawal'
  | 'investment'
  | 'transfer'
  | 'convert'
  | 'payment'

const ACTION_LABELS: Record<FinancialAction, string> = {
  deposit: 'make deposits',
  withdrawal: 'withdraw funds',
  investment: 'invest',
  transfer: 'transfer funds',
  convert: 'convert currency',
  payment: 'make payments',
}

export type KycProfileFields = {
  kyc_status?: string | null
  is_verified?: boolean | null
  verification_status?: string | null
}

/** Resolves the effective KYC status from all verification fields (Didit + legacy). */
export function resolveEffectiveKycStatus(data: KycProfileFields | null): string | null {
  if (!data) return null
  if (data.is_verified || String(data.verification_status).toLowerCase() === 'approved') {
    return 'Verified'
  }
  if (String(data.verification_status).toLowerCase() === 'declined') {
    return 'Rejected'
  }
  return (data.kyc_status as string | undefined) ?? null
}

export function normalizeKycStatus(status: string | null | undefined): KycStatus {
  const value = String(status ?? 'pending').toLowerCase()
  if (value === 'verified') return 'verified'
  if (value === 'rejected') return 'rejected'
  return 'pending'
}

export function isKycVerified(status: string | null | undefined): boolean {
  return normalizeKycStatus(status) === 'verified'
}

export function getKycBlockReason(
  status: string | null | undefined,
  action: FinancialAction
): string | null {
  if (isKycVerified(status)) return null

  const normalized = normalizeKycStatus(status)
  const actionLabel = ACTION_LABELS[action]

  if (normalized === 'rejected') {
    return `Your identity verification was rejected. You cannot ${actionLabel} until KYC is approved. Please contact support or resubmit your documents.`
  }

  return `Identity verification is required before you can ${actionLabel}. Complete KYC and wait for approval.`
}

export function getKycFinancialSummary(status: string | null | undefined): string | null {
  if (isKycVerified(status)) return null

  const normalized = normalizeKycStatus(status)

  if (normalized === 'rejected') {
    return 'Your KYC verification was rejected. Deposits, withdrawals, and investing are disabled until your identity is approved.'
  }

  return 'Complete KYC verification to deposit, withdraw, invest, and use other wallet features.'
}
