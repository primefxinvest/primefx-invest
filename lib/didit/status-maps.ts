export type UserVerificationStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'pending_review'
  | 'in_progress'
  | 'abandoned'

/** Normalize Didit status strings (Title Case from API, defensive lowercase). */
export function normalizeDiditStatus(status: string | null | undefined): string {
  if (!status) return 'In Progress'
  const trimmed = status.trim()
  const lower = trimmed.toLowerCase()

  const aliases: Record<string, string> = {
    approved: 'Approved',
    declined: 'Declined',
    expired: 'Expired',
    'kyc expired': 'KYC Expired',
    'in review': 'In Review',
    'in progress': 'In Progress',
    'not started': 'Not Started',
    abandoned: 'Abandoned',
    resubmitted: 'Resubmitted',
  }

  return aliases[lower] ?? trimmed
}

export function mapDiditStatusToVerificationStatus(
  diditStatus: string | null | undefined
): UserVerificationStatus {
  switch (normalizeDiditStatus(diditStatus)) {
    case 'Approved':
      return 'approved'
    case 'Declined':
      return 'declined'
    case 'Expired':
    case 'KYC Expired':
      return 'expired'
    case 'In Review':
      return 'pending_review'
    case 'In Progress':
    case 'Not Started':
    case 'Resubmitted':
      return 'in_progress'
    case 'Abandoned':
      return 'abandoned'
    default:
      return 'pending'
  }
}

export function mapDiditStatusToKycStatus(
  diditStatus: string | null | undefined
): 'Verified' | 'Pending' | 'Rejected' {
  switch (normalizeDiditStatus(diditStatus)) {
    case 'Approved':
      return 'Verified'
    case 'Declined':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

export function isTerminalDiditStatus(status: string | null | undefined): boolean {
  const normalized = normalizeDiditStatus(status)
  return (
    normalized === 'Approved' ||
    normalized === 'Declined' ||
    normalized === 'Expired' ||
    normalized === 'KYC Expired'
  )
}

export function isPendingDiditStatus(status: string | null | undefined): boolean {
  const normalized = normalizeDiditStatus(status)
  return (
    normalized === 'In Progress' ||
    normalized === 'Not Started' ||
    normalized === 'In Review' ||
    normalized === 'Resubmitted' ||
    normalized === 'Abandoned'
  )
}
