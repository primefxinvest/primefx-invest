'use client'

import { useMemo, useState, useTransition } from 'react'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import type { AdminWithdrawalQueueRow } from '@/lib/admin/queries'
import {
  approveWithdrawalQueueItem,
  adminUnlockWithdrawalHoldAction,
  rejectWithdrawalQueueItem,
} from '@/lib/admin/actions'
import { useWithdrawalHoldCountdown } from '@/lib/hooks/useWithdrawalHoldCountdown'
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'
import {
  canAdminApproveWithdrawal,
  formatEligiblePayoutDate,
  formatWithdrawalDisplayStatus,
  isWithdrawalOnHold,
  matchesWithdrawalAdminFilter,
  type WithdrawalAdminFilter,
  WITHDRAWAL_ADMIN_FILTERS,
} from '@/lib/wallet/withdrawal-status'
import { getWithdrawalAdminUnlockLabel } from '@/lib/wallet/withdrawal-admin-unlock'

const FILTER_LABELS: Record<WithdrawalAdminFilter, string> = {
  all: 'All',
  pending_hold: 'Pending Hold',
  ready_for_payout: 'Ready for Payout',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
}

function matchesWithdrawalSearch(row: AdminWithdrawalQueueRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    row.id,
    row.reference_id,
    row.user_email,
    row.user_id,
    row.primefx_id,
    row.payout_address,
    row.currency,
    row.method_label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

function AdminHoldCountdown({ row }: { row: AdminWithdrawalQueueRow }) {
  const countdown = useWithdrawalHoldCountdown({
    availableAt: row.available_at,
    status: row.status,
  })

  if (row.kind !== 'wallet' || row.status !== 'pending_notice') {
    return <span>{formatWithdrawalDisplayStatus(row.status)}</span>
  }

  return (
    <div className="space-y-1">
      <span>{countdown.displayStatus}</span>
      {!countdown.holdExpired ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">{countdown.holdRemaining}</p>
      ) : null}
    </div>
  )
}

export function AdminWithdrawalsView({
  rows,
  canApproveTransactions = false,
  canUnlockWithdrawals = false,
}: {
  rows: AdminWithdrawalQueueRow[]
  canApproveTransactions?: boolean
  canUnlockWithdrawals?: boolean
}) {
  const [filter, setFilter] = useState<WithdrawalAdminFilter>('all')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionKind, setActionKind] = useState<'approve' | 'reject' | 'unlock' | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) => matchesWithdrawalAdminFilter(row.status, filter) && matchesWithdrawalSearch(row, search)
      ),
    [rows, filter, search]
  )

  const handleApprove = (requestId: string) => {
    if (isPending) return
    setPendingId(requestId)
    setActionKind('approve')
    startTransition(async () => {
      try {
        await approveWithdrawalQueueItem(requestId)
        toast.success('Withdrawal approved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Approval failed')
      } finally {
        setPendingId(null)
        setActionKind(null)
      }
    })
  }

  const handleUnlock = (requestId: string) => {
    if (isPending) return
    setPendingId(requestId)
    setActionKind('unlock')
    startTransition(async () => {
      try {
        await adminUnlockWithdrawalHoldAction(requestId)
        toast.success('Withdrawal hold unlocked — user can withdraw immediately')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Unlock failed')
      } finally {
        setPendingId(null)
        setActionKind(null)
      }
    })
  }

  const handleReject = (requestId: string) => {
    if (isPending) return
    setPendingId(requestId)
    setActionKind('reject')
    startTransition(async () => {
      try {
        await rejectWithdrawalQueueItem(requestId)
        toast.success('Withdrawal rejected — funds returned')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Rejection failed')
      } finally {
        setPendingId(null)
        setActionKind(null)
      }
    })
  }

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Withdrawal Queue"
        description={`Wallet withdrawals require a ${WITHDRAWAL_NOTICE_DAYS}-day security hold before payout.`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ID, user, email, PrimeFx ID, wallet address…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none ring-[#0052ff] focus:ring-2"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filteredRows.length} result(s)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WITHDRAWAL_ADMIN_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? 'border-[#0052ff] bg-[#0052ff]/10 text-[#0052ff]'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <AdminTableCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Withdrawal ID</th>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Address / Network</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Requested</th>
                <th className="px-4 py-3 text-left font-semibold">Eligible Payout</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No withdrawal requests match this filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const approvable =
                    row.kind === 'wallet' &&
                    canAdminApproveWithdrawal({
                      status: row.status,
                      availableAt: row.available_at,
                    })
                  const rejectable =
                    row.kind === 'wallet' &&
                    ['pending_notice', 'ready', 'approved'].includes(String(row.status).toLowerCase())
                  const showApprove = canApproveTransactions && approvable
                  const showReject = canApproveTransactions && rejectable
                  const showUnlock =
                    canUnlockWithdrawals && row.kind === 'wallet' && isWithdrawalOnHold(row.status)
                  const adminUnlockLabel = getWithdrawalAdminUnlockLabel(row.metadata)
                  const busy = isPending && pendingId === row.id

                  return (
                    <tr key={`${row.kind}-${row.id}`} className="hover:bg-background/60">
                      <td className="px-4 py-3 capitalize">{row.kind}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">{row.id.slice(0, 8)}…</p>
                        {row.reference_id ? (
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{row.reference_id}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.user_email}</p>
                        <p className="text-xs text-muted-foreground">{row.primefx_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>${row.amount_usd.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Net ${row.net_amount_usd.toFixed(2)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {row.payout_address ? (
                          <>
                            <p className="max-w-[180px] truncate font-mono text-xs">{row.payout_address}</p>
                            <p className="text-xs text-muted-foreground">{row.network_label}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AdminHoldCountdown row={row} />
                        {adminUnlockLabel ? (
                          <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                            {adminUnlockLabel}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(row.requested_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatEligiblePayoutDate(row.available_at)}
                      </td>
                      <td className="px-4 py-3">
                        {row.kind === 'wallet' ? (
                          <div className="flex items-center gap-2">
                            {showApprove ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleApprove(row.id)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {busy && actionKind === 'approve' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : null}
                                Approve
                              </button>
                            ) : null}
                            {showReject ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleReject(row.id)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                              >
                                {busy && actionKind === 'reject' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : null}
                                Reject
                              </button>
                            ) : null}
                            {showUnlock ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleUnlock(row.id)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
                              >
                                {busy && actionKind === 'unlock' ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : null}
                                Unlock Withdrawal
                              </button>
                            ) : null}
                            {!showApprove && !showReject && !showUnlock ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Capital (separate flow)</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminTableCard>
    </div>
  )
}
