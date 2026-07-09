'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  formatWithdrawalDisplayStatus,
  formatWithdrawalHoldRemaining,
  getWithdrawalHoldRemainingMs,
  isWithdrawalOnHold,
} from '@/lib/wallet/withdrawal-status'

/** Live hold countdown — ticks every second while on hold. */
export function useWithdrawalHoldCountdown(input: {
  availableAt: string | null | undefined
  status: string | null | undefined
}) {
  const [now, setNow] = useState(() => new Date())
  const onHold = isWithdrawalOnHold(input.status)

  useEffect(() => {
    if (!onHold || !input.availableAt) return

    const remainingMs = getWithdrawalHoldRemainingMs(input.availableAt, new Date())
    if (remainingMs <= 0) return

    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [input.availableAt, onHold])

  return useMemo(() => {
    const holdExpired =
      onHold && input.availableAt
        ? getWithdrawalHoldRemainingMs(input.availableAt, now) <= 0
        : false

    const holdRemaining = input.availableAt
      ? formatWithdrawalHoldRemaining(input.availableAt, now)
      : '—'

    const displayStatus = holdExpired
      ? 'Ready for Payout'
      : formatWithdrawalDisplayStatus(input.status)

    return {
      now,
      onHold,
      holdExpired,
      holdRemaining,
      displayStatus,
      remainingMs: input.availableAt ? getWithdrawalHoldRemainingMs(input.availableAt, now) : 0,
    }
  }, [input.availableAt, input.status, now, onHold])
}
