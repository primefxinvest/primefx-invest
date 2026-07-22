'use client'

import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { pageStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-all text-sm font-semibold text-foreground sm:text-right">{value}</dd>
    </div>
  )
}

export function WithdrawSuccessView() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('ref')?.trim() ?? '—'
  const amount = searchParams.get('amount')?.trim()
  const network = searchParams.get('network')?.trim() ?? '—'
  const address = searchParams.get('address')?.trim() ?? '—'
  const amountLabel = amount
    ? `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'

  return (
    <div className={cn('mx-auto max-w-xl pb-24 md:pb-0', pageStackClass)}>
      <WalletPageHeader
        title="Withdrawal Submitted"
        description="Your request is in the review queue."
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Withdrawal Submitted Successfully
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your request has been received.
          </p>
        </div>

        <dl className="mt-8">
          <Detail label="Status" value="Pending Review" />
          <Detail label="Estimated processing" value="Within 24 hours" />
          <Detail label="Reference ID" value={reference} />
          <Detail label="Amount" value={amountLabel} />
          <Detail label="Network" value={network} />
          <Detail label="Wallet Address" value={address} />
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-5 text-sm font-semibold text-white shadow-lg shadow-[#0052ff]/20"
          >
            Return to Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/wallet/withdraw"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground"
          >
            View Withdraw History
          </Link>
        </div>
      </div>
    </div>
  )
}
