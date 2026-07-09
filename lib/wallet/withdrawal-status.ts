import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'

/** Internal withdrawal request statuses stored in the database. */
export type WithdrawalRequestStatus =
  | 'pending_notice'
  | 'ready'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type WithdrawalDisplayStatus =
  | 'Pending Hold'
  | 'Ready for Payout'
  | 'Approved'
  | 'Completed'
  | 'Rejected'

const DISPLAY_STATUS: Record<string, WithdrawalDisplayStatus> = {
  pending_notice: 'Pending Hold',
  ready: 'Ready for Payout',
  approved: 'Approved',
  processing: 'Approved',
  completed: 'Completed',
  cancelled: 'Rejected',
  failed: 'Rejected',
}

export function formatWithdrawalDisplayStatus(status: string | null | undefined): WithdrawalDisplayStatus {
  const key = String(status ?? '').toLowerCase()
  return DISPLAY_STATUS[key] ?? 'Pending Hold'
}

export function isWithdrawalOnHold(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase() === 'pending_notice'
}

export function isWithdrawalReadyForPayout(status: string | null | undefined): boolean {
  return String(status ?? '').toLowerCase() === 'ready'
}

export function canAdminApproveWithdrawal(input: {
  status: string | null | undefined
  availableAt: string | Date | null | undefined
  now?: Date
}): boolean {
  const status = String(input.status ?? '').toLowerCase()
  if (status !== 'ready') return false
  if (!input.availableAt) return false
  return new Date(input.availableAt).getTime() <= (input.now ?? new Date()).getTime()
}

export function getWithdrawalHoldRemainingMs(
  availableAt: string | Date | null | undefined,
  now: Date = new Date()
): number {
  if (!availableAt) return 0
  return Math.max(0, new Date(availableAt).getTime() - now.getTime())
}

export function formatWithdrawalHoldRemaining(
  availableAt: string | Date | null | undefined,
  now: Date = new Date()
): string {
  const ms = getWithdrawalHoldRemainingMs(availableAt, now)
  if (ms <= 0) return 'Ready for Payout'

  const totalSeconds = Math.ceil(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) {
    return `${days} Day${days === 1 ? '' : 's'} ${hours} Hour${hours === 1 ? '' : 's'} Remaining`
  }

  if (hours > 0) {
    return `${hours} Hour${hours === 1 ? '' : 's'} ${minutes} Minute${minutes === 1 ? '' : 's'} Remaining`
  }

  return `${Math.max(1, minutes)} Minute${minutes === 1 ? '' : 's'} Remaining`
}

export function formatCompletedDate(processedAt: string | Date | null | undefined): string {
  if (!processedAt) return '—'
  return formatRequestedDate(processedAt)
}

export function formatEligiblePayoutDate(availableAt: string | Date | null | undefined): string {
  if (!availableAt) return '—'
  return new Date(availableAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRequestedDate(requestedAt: string | Date | null | undefined): string {
  if (!requestedAt) return '—'
  return new Date(requestedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const WITHDRAWAL_ADMIN_FILTERS = [
  'all',
  'pending_hold',
  'ready_for_payout',
  'approved',
  'completed',
  'rejected',
] as const

export type WithdrawalAdminFilter = (typeof WITHDRAWAL_ADMIN_FILTERS)[number]

export function matchesWithdrawalAdminFilter(
  status: string | null | undefined,
  filter: WithdrawalAdminFilter
): boolean {
  if (filter === 'all') return true
  const normalized = String(status ?? '').toLowerCase()
  switch (filter) {
    case 'pending_hold':
      return normalized === 'pending_notice'
    case 'ready_for_payout':
      return normalized === 'ready'
    case 'approved':
      return normalized === 'approved' || normalized === 'processing'
    case 'completed':
      return normalized === 'completed'
    case 'rejected':
      return normalized === 'cancelled' || normalized === 'failed'
    default:
      return true
  }
}

export function getWithdrawalNoticeDays(): number {
  return WITHDRAWAL_NOTICE_DAYS
}
