export type UserVerificationStatus = 'pending' | 'approved' | 'declined' | 'expired'

export function mapDiditStatusToVerificationStatus(
  diditStatus: string | null | undefined
): UserVerificationStatus {
  switch (diditStatus) {
    case 'Approved':
      return 'approved'
    case 'Declined':
      return 'declined'
    case 'Expired':
    case 'KYC Expired':
      return 'expired'
    default:
      return 'pending'
  }
}

export function mapDiditStatusToKycStatus(
  diditStatus: string | null | undefined
): 'Verified' | 'Pending' | 'Rejected' {
  switch (diditStatus) {
    case 'Approved':
      return 'Verified'
    case 'Declined':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

export function isTerminalDiditStatus(status: string | null | undefined): boolean {
  return (
    status === 'Approved' ||
    status === 'Declined' ||
    status === 'Expired' ||
    status === 'KYC Expired'
  )
}
