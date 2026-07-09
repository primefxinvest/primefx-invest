'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { WalletWithdrawalRequestItem } from '@/lib/data/types'
import { WithdrawalDetailCard } from '@/components/wallet/withdraw/WithdrawalDetailCard'
import { useWithdrawalHoldCountdown } from '@/lib/hooks/useWithdrawalHoldCountdown'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'

function WithdrawalHistoryRow({
  withdrawal,
  expanded,
  onToggle,
}: {
  withdrawal: WalletWithdrawalRequestItem
  expanded: boolean
  onToggle: () => void
}) {
  const countdown = useWithdrawalHoldCountdown({
    availableAt: withdrawal.availableAt,
    status: withdrawal.status,
  })

  const statusLabel =
    countdown.holdExpired && withdrawal.status === 'pending_notice'
      ? 'Ready for Payout'
      : withdrawal.displayStatus

  const substatus =
    withdrawal.status === 'pending_notice'
      ? countdown.holdRemaining
      : withdrawal.status === 'processing'
        ? withdrawal.estimatedCompletion
        : null

  return (
    <li className="rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{withdrawal.methodLabel}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {withdrawal.networkLabel} · {withdrawal.referenceId ?? withdrawal.id.slice(0, 8)}
          </p>
          {substatus ? <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">{substatus}</p> : null}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">-{formatCurrency(withdrawal.amountUsd)}</p>
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              {statusLabel}
            </span>
          </div>
          <ChevronDown
            className={cn('mt-1 h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
          />
        </div>
      </button>
      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-2">
          <WithdrawalDetailCard withdrawal={withdrawal} />
        </div>
      ) : null}
    </li>
  )
}

export function WithdrawalHistorySection({
  withdrawals,
  loading,
  error,
  onRetry,
  onHoldExpired,
}: {
  withdrawals: WalletWithdrawalRequestItem[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onHoldExpired?: () => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const activeHold = useMemo(
    () => withdrawals.find((row) => row.status === 'pending_notice'),
    [withdrawals]
  )

  const countdown = useWithdrawalHoldCountdown({
    availableAt: activeHold?.availableAt,
    status: activeHold?.status,
  })

  useEffect(() => {
    if (countdown.holdExpired && activeHold) {
      onHoldExpired?.()
    }
  }, [countdown.holdExpired, activeHold, onHoldExpired])

  if (loading) {
    return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading withdrawal history…</div>
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        {error}
        {onRetry ? (
          <button type="button" onClick={onRetry} className="ml-2 font-semibold underline">
            Retry
          </button>
        ) : null}
      </div>
    )
  }

  if (!withdrawals.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No withdrawal history yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">Withdrawal History</h3>
        <span className="text-xs text-muted-foreground">{withdrawals.length} total</span>
      </div>
      <ul className="space-y-3">
        {withdrawals.map((withdrawal) => (
          <WithdrawalHistoryRow
            key={withdrawal.id}
            withdrawal={withdrawal}
            expanded={expandedId === withdrawal.id}
            onToggle={() => setExpandedId((current) => (current === withdrawal.id ? null : withdrawal.id))}
          />
        ))}
      </ul>
    </div>
  )
}
