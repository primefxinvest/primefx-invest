'use client'

import { CheckCircle2, Circle, Clock3, ExternalLink } from 'lucide-react'
import type { WalletWithdrawalRequestItem } from '@/lib/data/types'
import { useWithdrawalHoldCountdown } from '@/lib/hooks/useWithdrawalHoldCountdown'
import {
  formatCompletedDate,
  formatEligiblePayoutDate,
  formatRequestedDate,
} from '@/lib/wallet/withdrawal-status'
import { getWithdrawalTimelineSteps } from '@/lib/wallet/withdrawal-timeline'
import { cn } from '@/lib/utils'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm font-medium text-foreground sm:text-right">{value}</dd>
    </div>
  )
}

export function WithdrawalDetailCard({ withdrawal }: { withdrawal: WalletWithdrawalRequestItem }) {
  const countdown = useWithdrawalHoldCountdown({
    availableAt: withdrawal.availableAt,
    status: withdrawal.status,
  })

  const timeline = getWithdrawalTimelineSteps({
    status: countdown.holdExpired && withdrawal.status === 'pending_notice' ? 'ready' : withdrawal.status,
    availableAt: withdrawal.availableAt,
    now: countdown.now,
  })

  const statusLabel =
    countdown.holdExpired && withdrawal.status === 'pending_notice'
      ? 'Ready for Payout'
      : withdrawal.displayStatus

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Withdrawal ID
          </p>
          <p className="mt-1 break-all font-mono text-sm text-foreground">{withdrawal.id}</p>
          {withdrawal.referenceId ? (
            <p className="mt-1 break-all text-xs text-muted-foreground">{withdrawal.referenceId}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
            statusLabel === 'Completed'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : statusLabel === 'Rejected'
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : statusLabel === 'Ready for Payout'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          )}
        >
          {statusLabel}
        </span>
      </div>

      {withdrawal.status === 'pending_notice' ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span>{countdown.holdRemaining}</span>
        </div>
      ) : null}

      <dl className="grid gap-3 border-b border-border pb-4">
        <DetailRow label="Wallet Address" value={withdrawal.payoutAddress ?? '—'} />
        <DetailRow label="Network" value={withdrawal.networkLabel} />
        <DetailRow label="Amount" value={`$${withdrawal.amountUsd.toFixed(2)}`} />
        <DetailRow label="Platform Fee" value={`$${withdrawal.feeUsd.toFixed(2)}`} />
        <DetailRow label="Network Fee (est.)" value={`$${withdrawal.networkFeeUsd.toFixed(2)}`} />
        <DetailRow label="Final Amount" value={`$${withdrawal.netAmountUsd.toFixed(2)}`} />
        <DetailRow label="Requested Date" value={formatRequestedDate(withdrawal.requestedAt)} />
        <DetailRow label="Eligible Payout Date" value={formatEligiblePayoutDate(withdrawal.availableAt)} />
        <DetailRow label="Completed Date" value={formatCompletedDate(withdrawal.processedAt)} />
        <DetailRow
          label="Transaction Hash"
          value={
            withdrawal.transactionHash ? (
              withdrawal.explorerUrl ? (
                <a
                  href={withdrawal.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#0052ff] hover:underline"
                >
                  {withdrawal.transactionHash}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                withdrawal.transactionHash
              )
            ) : (
              '—'
            )
          }
        />
        {withdrawal.status === 'processing' || withdrawal.status === 'completed' ? (
          <>
            <DetailRow
              label="Confirmations"
              value={withdrawal.confirmations != null ? String(withdrawal.confirmations) : 'Pending'}
            />
            <DetailRow label="Estimated Completion" value={withdrawal.estimatedCompletion} />
          </>
        ) : null}
        <DetailRow label="Current Status" value={statusLabel} />
      </dl>

      <div className="pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Timeline
        </p>
        <ol className="space-y-3">
          {timeline.map((step) => (
            <li key={step.key} className="flex items-start gap-3">
              {step.state === 'done' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : step.state === 'active' ? (
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#0052ff]" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  'text-sm',
                  step.state === 'done'
                    ? 'text-foreground'
                    : step.state === 'active'
                      ? 'font-semibold text-[#0052ff]'
                      : 'text-muted-foreground'
                )}
              >
                {step.state === 'done' ? '✓ ' : ''}
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
