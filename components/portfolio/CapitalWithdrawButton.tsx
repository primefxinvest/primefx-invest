'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitCapitalWithdrawalAction } from '@/lib/invest/capital-actions'
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'

export function CapitalWithdrawButton({
  investmentId,
  planName,
}: {
  investmentId: string
  planName: string
}) {
  const [pending, startTransition] = useTransition()
  const [requested, setRequested] = useState(false)

  const handleClick = () => {
    startTransition(async () => {
      const result = await submitCapitalWithdrawalAction({ investmentId })
      if (!result.success) {
        toast.error(result.error ?? 'Request failed')
        return
      }
      setRequested(true)
      toast.success('Capital withdrawal requested', {
        description: `Funds will be available after ${WITHDRAWAL_NOTICE_DAYS}-day notice. Contact PrimeFx Support if needed.`,
      })
    })
  }

  if (requested) {
    return (
      <span className="text-[11px] font-medium text-amber-700">Withdrawal pending</span>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      title={`Request capital withdrawal (${WITHDRAWAL_NOTICE_DAYS}-day notice)`}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Withdraw capital
    </button>
  )
}
