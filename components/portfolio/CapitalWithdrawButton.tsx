'use client'

import { useMemo, useTransition } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { submitCapitalWithdrawalAction } from '@/lib/invest/capital-actions'
import { formatCurrency, formatDateTime } from '@/lib/data/format'
import type { CapitalWithdrawalRequestItem } from '@/lib/data/types'
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'
import { useEmailVerification } from '@/lib/auth/email-verification-context'
import { isEmailNotVerifiedResult } from '@/lib/auth/email-verification-client'
import { cn } from '@/lib/utils'

function formatAvailableDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function isCapitalWithdrawalAvailable(availableAt: string) {
  return new Date(availableAt).getTime() <= Date.now()
}

export function CapitalWithdrawButton({
  investmentId,
  planName,
  pendingRequest,
  isCapitalUnlocked = true,
  lockCountdown,
  capitalLockDays = 0,
  onRequested,
}: {
  investmentId: string
  planName: string
  pendingRequest?: CapitalWithdrawalRequestItem
  isCapitalUnlocked?: boolean
  lockCountdown?: string
  capitalLockDays?: number
  onRequested?: () => void
}) {
  const [pending, startTransition] = useTransition()
  const { requireVerifiedEmail, openVerificationModal } = useEmailVerification()

  const handleClick = () => {
    if (!requireVerifiedEmail()) return

    startTransition(async () => {
      const result = await submitCapitalWithdrawalAction({ investmentId })
      if (!result.success) {
        if (isEmailNotVerifiedResult(result)) {
          openVerificationModal()
        }
        toast.error(result.error ?? 'Request failed')
        return
      }

      onRequested?.()

      toast.success('Capital withdrawal requested', {
        description: `${formatCurrency(result.amountUsd)} from ${planName} will return to your wallet on ${formatAvailableDate(result.availableAt)} (${WITHDRAWAL_NOTICE_DAYS}-day notice).`,
      })
    })
  }

  const statusContent = useMemo(() => {
    if (!pendingRequest) return null

    const available = isCapitalWithdrawalAvailable(pendingRequest.availableAt)
    const amountLabel = formatCurrency(pendingRequest.amountUsd)

    if (available) {
      return {
        label: 'Processing return to wallet',
        detail: `${amountLabel} · notice period completed`,
        className: 'text-blue-700',
      }
    }

    return {
      label: 'Withdrawal pending',
      detail: `${amountLabel} · available ${formatAvailableDate(pendingRequest.availableAt)}`,
      className: 'text-amber-700',
    }
  }, [pendingRequest])

  if (statusContent) {
    return (
      <div className="min-w-[140px] text-right">
        <p className={cn('text-[11px] font-semibold', statusContent.className)}>
          {statusContent.label}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">{statusContent.detail}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Requested {formatDateTime(pendingRequest!.requestedAt)}
        </p>
      </div>
    )
  }

  if (!isCapitalUnlocked && capitalLockDays > 0) {
    return (
      <div className="text-right">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-400"
        >
          <Lock className="h-3 w-3" />
          Withdraw capital
        </button>
        <p className="mt-1 text-[10px] font-medium text-amber-700">
          Available in: {lockCountdown ?? `${capitalLockDays} days`}
        </p>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      title={`Request capital withdrawal (${WITHDRAWAL_NOTICE_DAYS}-day notice before funds return to wallet)`}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Withdraw capital
    </button>
  )
}
