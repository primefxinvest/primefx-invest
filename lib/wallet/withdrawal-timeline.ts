import { getWithdrawalHoldRemainingMs, isWithdrawalOnHold } from '@/lib/wallet/withdrawal-status'

export type WithdrawalTimelineStep = {
  key: string
  label: string
  state: 'done' | 'active' | 'pending' | 'skipped'
}

function statusRank(status: string): number {
  const map: Record<string, number> = {
    pending: 2,
    pending_notice: 1,
    ready: 2,
    approved: 3,
    processing: 4,
    completed: 5,
    cancelled: 6,
    failed: 6,
  }
  return map[status.toLowerCase()] ?? 0
}

export function getWithdrawalTimelineSteps(input: {
  status: string
  availableAt?: string | null
  now?: Date
  adminUnlocked?: boolean
}): WithdrawalTimelineStep[] {
  const status = String(input.status ?? '').toLowerCase()
  const now = input.now ?? new Date()
  const rejected = status === 'cancelled' || status === 'failed'
  const rank = statusRank(status)
  const isLegacyHold = status === 'pending_notice'

  if (rejected) {
    return [
      { key: 'requested', label: 'Withdrawal Requested', state: 'done' },
      { key: 'reserved', label: 'Funds Reserved', state: 'done' },
      { key: 'review', label: 'Pending Review', state: 'done' },
      { key: 'rejected', label: 'Rejected — Funds Returned', state: 'active' },
    ]
  }

  // Modern Binance-style flow
  if (!isLegacyHold) {
    return [
      { key: 'requested', label: 'Withdrawal Requested', state: 'done' },
      { key: 'reserved', label: 'Funds Reserved', state: 'done' },
      {
        key: 'review',
        label: 'Pending Review',
        state: rank === 2 ? 'active' : rank > 2 ? 'done' : 'pending',
      },
      {
        key: 'approved',
        label: 'Approved',
        state: rank === 3 || rank === 4 ? 'active' : rank > 4 ? 'done' : 'pending',
      },
      {
        key: 'completed',
        label: 'Paid',
        state: rank === 5 ? 'done' : 'pending',
      },
    ]
  }

  const holdExpired =
    isWithdrawalOnHold(status) && input.availableAt
      ? getWithdrawalHoldRemainingMs(input.availableAt, now) <= 0
      : rank >= 2

  const adminUnlocked = Boolean(input.adminUnlocked)
  const holdState: WithdrawalTimelineStep['state'] =
    rank > 1 || holdExpired || adminUnlocked
      ? 'done'
      : rank === 1 && !holdExpired
        ? 'active'
        : 'pending'
  const holdLabel = adminUnlocked ? 'Unlocked by Admin' : 'Security Hold (7 Days)'

  return [
    { key: 'requested', label: 'Withdrawal Requested', state: 'done' },
    { key: 'reserved', label: 'Funds Reserved', state: 'done' },
    { key: 'hold', label: holdLabel, state: holdState },
    {
      key: 'ready',
      label: 'Ready for Payout',
      state: holdExpired && rank === 1 ? 'active' : rank >= 2 ? 'done' : 'pending',
    },
    {
      key: 'approved',
      label: 'Approved',
      state: rank === 3 || rank === 4 ? 'active' : rank > 4 ? 'done' : 'pending',
    },
    {
      key: 'completed',
      label: 'Paid',
      state: rank === 5 ? 'done' : 'pending',
    },
  ]
}
