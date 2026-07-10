'use client'

import { useEffect, useState } from 'react'
import { getDepositSettlementDetails } from '@/lib/admin/actions'

type AdminDepositSettlementPanelProps = {
  referenceId: string | null | undefined
}

export function AdminDepositSettlementPanel({ referenceId }: AdminDepositSettlementPanelProps) {
  const [details, setDetails] = useState<Awaited<ReturnType<typeof getDepositSettlementDetails>> | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!referenceId) {
      setDetails(null)
      return
    }

    let cancelled = false
    setLoading(true)

    void getDepositSettlementDetails(referenceId)
      .then((result) => {
        if (!cancelled) setDetails(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [referenceId])

  if (!referenceId) return null
  if (loading) {
    return <p className="mt-2 text-xs text-muted-foreground">Loading deposit settlement…</p>
  }
  if (!details?.found) return null

  const formatUsd = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="mt-3 rounded-lg border border-border/80 bg-muted/20 p-3 text-xs">
      <p className="font-semibold text-foreground">NOWPayments settlement</p>
      <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Requested amount</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(details.requestedAmountUsd)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Received amount</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(details.receivedAmountUsd)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Credited amount</dt>
          <dd className="font-semibold tabular-nums text-emerald-700">
            {formatUsd(details.creditedAmountUsd)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Difference</dt>
          <dd className="font-semibold tabular-nums">{formatUsd(details.differenceUsd)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Webhook status</dt>
          <dd className="font-medium uppercase">{details.providerStatus ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:flex-col sm:justify-start">
          <dt className="text-muted-foreground">Deposit status</dt>
          <dd className="font-medium">{details.completionStatus ?? details.paymentStatus ?? '—'}</dd>
        </div>
      </dl>
      {details.auditTrail.length > 0 ? (
        <div className="mt-3 border-t border-border/70 pt-2">
          <p className="font-semibold text-foreground">Audit trail</p>
          <ul className="mt-1 space-y-1 text-muted-foreground">
            {details.auditTrail.map((entry) => (
              <li key={entry.id}>
                {entry.eventType} · {formatUsd(entry.amountUsd ?? 0)} ·{' '}
                {new Date(entry.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
