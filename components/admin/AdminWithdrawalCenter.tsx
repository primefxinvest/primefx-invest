'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import {
  ArrowDownUp,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  Search,
  Unlock,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { AdminWithdrawalQueueRow } from '@/lib/admin/queries'
import {
  approveWithdrawalQueueItem,
  adminRelockWithdrawalHoldAction,
  adminUnlockWithdrawalHoldAction,
  bulkApproveWithdrawalsAction,
  bulkRejectWithdrawalsAction,
  markWithdrawalPaidQueueItem,
  rejectWithdrawalQueueItem,
} from '@/lib/admin/actions'
import { formatRiskScoreLabel, riskScoreTone } from '@/lib/admin/withdrawal-risk'
import { useWithdrawalHoldCountdown } from '@/lib/hooks/useWithdrawalHoldCountdown'
import { useAdminWithdrawalRealtime } from '@/lib/hooks/useAdminWithdrawalRealtime'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import {
  canAdminApproveWithdrawal,
  canAdminMarkWithdrawalPaid,
  formatWithdrawalDisplayStatus,
  isWithdrawalOnHold,
  matchesWithdrawalAdminFilter,
  type WithdrawalAdminFilter,
  WITHDRAWAL_ADMIN_FILTERS,
} from '@/lib/wallet/withdrawal-status'
import { getWithdrawalAdminUnlockLabel } from '@/lib/wallet/withdrawal-admin-unlock'
import { cn } from '@/lib/utils'

const FILTER_LABELS: Record<WithdrawalAdminFilter, string> = {
  all: 'All',
  pending_hold: 'Locked',
  ready_for_payout: 'Pending',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
}

type SortKey = 'requested_at' | 'amount_usd' | 'risk_score' | 'available_at'

function matchesSearch(row: AdminWithdrawalQueueRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    row.id,
    row.reference_id,
    row.user_email,
    row.user_name,
    row.user_id,
    row.primefx_id,
    row.payout_address,
    row.currency,
    row.transaction_hash,
    row.user_country,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

function HoldBadge({ row }: { row: AdminWithdrawalQueueRow }) {
  const countdown = useWithdrawalHoldCountdown({
    availableAt: row.available_at,
    status: row.status,
  })

  if (row.kind !== 'wallet' || row.status !== 'pending_notice') {
    return <span>{formatWithdrawalDisplayStatus(row.status)}</span>
  }

  return (
    <div>
      <span>{countdown.displayStatus}</span>
      {!countdown.holdExpired ? (
        <p className="mt-1 text-xs text-amber-700">{countdown.holdRemaining}</p>
      ) : null}
    </div>
  )
}

function ReasonModal({
  open,
  title,
  confirmLabel,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean
  title: string
  confirmLabel: string
  onClose: () => void
  onConfirm: (reason: string) => void
  busy: boolean
}) {
  const [reason, setReason] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Provide a reason for the audit log.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0052ff]"
          placeholder="Enter reason…"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function WithdrawalCard({
  row,
  selected,
  onToggle,
  canApproveTransactions,
  canUnlockWithdrawals,
  onAction,
  busyId,
}: {
  row: AdminWithdrawalQueueRow
  selected: boolean
  onToggle: () => void
  canApproveTransactions: boolean
  canUnlockWithdrawals: boolean
  onAction: (kind: 'approve' | 'reject' | 'unlock' | 'relock' | 'markPaid', id: string) => void
  busyId: string | null
}) {
  const approvable = row.kind === 'wallet' && canAdminApproveWithdrawal({ status: row.status, availableAt: row.available_at })
  const markable = row.kind === 'wallet' && canAdminMarkWithdrawalPaid({ status: row.status })
  const rejectable =
    row.kind === 'wallet' &&
    ['pending', 'pending_notice', 'ready', 'approved'].includes(String(row.status).toLowerCase())
  const showUnlock = canUnlockWithdrawals && row.kind === 'wallet' && isWithdrawalOnHold(row.status)
  const showRelock =
    canUnlockWithdrawals && row.kind === 'wallet' && String(row.status).toLowerCase() === 'ready'
  const busy = busyId === row.id
  const riskLabel = formatRiskScoreLabel(row.risk_score)
  const riskTone = riskScoreTone(row.risk_score)
  const avatar = row.user_avatar_url || getDefaultAvatarUrl(row.user_name ?? row.user_email)
  const unlockLabel = getWithdrawalAdminUnlockLabel(row.metadata)
  const coin =
    String((row.metadata as Record<string, unknown>)?.coin ?? row.currency ?? '—').toUpperCase()
  const network =
    String((row.metadata as Record<string, unknown>)?.network ?? row.network_label ?? '—')
  const walletAddress =
    row.payout_address ||
    (typeof row.metadata?.wallet_address === 'string' ? row.metadata.wallet_address : null) ||
    null

  const copyAddress = async () => {
    if (!walletAddress) return
    await navigator.clipboard.writeText(walletAddress)
    toast.success('Address copied')
  }

  const copyReference = async () => {
    if (!row.reference_id) return
    await navigator.clipboard.writeText(row.reference_id)
    toast.success('Reference copied')
  }

  return (
    <article
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-colors',
        selected ? 'border-[#0052ff] ring-1 ring-[#0052ff]/30' : 'border-border'
      )}
    >
      <div className="flex items-start gap-3">
        {canApproveTransactions && row.kind === 'wallet' ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="mt-1 h-4 w-4"
            aria-label={`Select withdrawal ${row.id}`}
          />
        ) : (
          <div className="w-4" />
        )}
        <img src={avatar} alt="" className="h-11 w-11 rounded-full border border-border object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{row.user_name || row.user_email}</p>
              <p className="text-sm text-muted-foreground">{row.user_email}</p>
              <p className="text-xs text-muted-foreground">{row.primefx_id}{row.user_country ? ` · ${row.user_country}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">${row.amount_usd.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Fee ${row.fee_usd.toFixed(2)} · Net ${row.net_amount_usd.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><span className="text-muted-foreground">User:</span> {row.user_name || '—'}</div>
            <div><span className="text-muted-foreground">Email:</span> {row.user_email}</div>
            <div><span className="text-muted-foreground">Coin:</span> {coin}</div>
            <div><span className="text-muted-foreground">Network:</span> {network}</div>
            <div><span className="text-muted-foreground">Amount:</span> ${row.amount_usd.toFixed(2)}</div>
            <div><span className="text-muted-foreground">Fee:</span> ${row.fee_usd.toFixed(2)}</div>
            <div><span className="text-muted-foreground">Net:</span> ${row.net_amount_usd.toFixed(2)}</div>
            <div><span className="text-muted-foreground">KYC:</span> {row.kyc_status}</div>
            <div><span className="text-muted-foreground">Country:</span> {row.user_country ?? '—'}</div>
            <div>
              <span className="text-muted-foreground">Risk:</span>{' '}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  riskTone === 'danger' && 'bg-red-100 text-red-700',
                  riskTone === 'warning' && 'bg-amber-100 text-amber-800',
                  riskTone === 'success' && 'bg-emerald-100 text-emerald-700'
                )}
              >
                {riskLabel} ({row.risk_score})
              </span>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Wallet Address:</span>{' '}
              <span className="font-mono text-xs">{walletAddress ?? '—'}</span>
              {walletAddress ? (
                <button
                  type="button"
                  onClick={() => void copyAddress()}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] font-medium"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              ) : null}
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Reference:</span>{' '}
              <span className="font-mono text-xs">{row.reference_id ?? '—'}</span>
              {row.reference_id ? (
                <button
                  type="button"
                  onClick={() => void copyReference()}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] font-medium"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              ) : null}
            </div>
            {row.transaction_hash ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-muted-foreground">Tx hash:</span>{' '}
                <span className="font-mono text-xs">{row.transaction_hash}</span>
              </div>
            ) : null}
            <div><span className="text-muted-foreground">Requested:</span> {new Date(row.requested_at).toLocaleString()}</div>
            <div><span className="text-muted-foreground">Status:</span> <HoldBadge row={row} /></div>
          </div>

          {unlockLabel ? (
            <p className="mt-2 text-xs font-medium text-blue-700">{unlockLabel}</p>
          ) : null}
          {row.admin_notes ? (
            <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Admin notes: {row.admin_notes}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {canApproveTransactions && approvable ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('approve', row.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Approve
              </button>
            ) : null}
            {canApproveTransactions && markable ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('markPaid', row.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0052ff] px-3 py-1.5 text-xs font-semibold text-white"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Mark as Paid
              </button>
            ) : null}
            {canApproveTransactions && rejectable ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('reject', row.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                <X className="h-3 w-3" />
                Reject
              </button>
            ) : null}
            {showUnlock ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('unlock', row.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
              >
                <Unlock className="h-3 w-3" />
                Unlock
              </button>
            ) : null}
            {showRelock ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAction('relock', row.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
              >
                <Lock className="h-3 w-3" />
                Lock Again
              </button>
            ) : null}
            <Link
              href={`/admin/users/${row.user_id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              Open User
            </Link>
            <Link
              href={`/admin/wallets?user=${row.user_id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
            >
              View Wallet
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export function AdminWithdrawalCenter({
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
  const [sortKey, setSortKey] = useState<SortKey>('requested_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [modal, setModal] = useState<{
    kind: 'reject' | 'unlock' | 'relock' | 'bulkReject'
    requestId?: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  useAdminWithdrawalRealtime({ enabled: true })

  const filteredRows = useMemo(() => {
    const list = rows.filter(
      (row) => matchesWithdrawalAdminFilter(row.status, filter) && matchesSearch(row, search)
    )
    return list.sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'requested_at') {
        return (new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime()) * dir
      }
      if (sortKey === 'available_at') {
        return (new Date(a.available_at).getTime() - new Date(b.available_at).getTime()) * dir
      }
      return (Number(a[sortKey]) - Number(b[sortKey])) * dir
    })
  }, [rows, filter, search, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((current) => !current)
      return
    }
    setSortKey(key)
    setSortAsc(false)
  }

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exportCsv = () => {
    const header = [
      'ID',
      'User',
      'Email',
      'Amount',
      'Status',
      'Coin',
      'Network',
      'Address',
      'Requested',
      'Unlock Date',
      'KYC',
      'Email Verified',
      'Risk Score',
    ]
    const lines = filteredRows.map((row) =>
      [
        row.id,
        row.user_name ?? '',
        row.user_email,
        row.amount_usd,
        row.status,
        row.currency ?? '',
        row.network_label,
        row.payout_address ?? '',
        row.requested_at,
        row.available_at,
        row.kyc_status,
        row.email_verified,
        row.risk_score,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `withdrawals-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const runModalConfirm = (reason: string) => {
    if (!modal) return
    startTransition(async () => {
      try {
        if (modal.kind === 'unlock' && modal.requestId) {
          setBusyId(modal.requestId)
          await adminUnlockWithdrawalHoldAction(modal.requestId, reason)
          toast.success('Withdrawal unlocked')
        } else if (modal.kind === 'relock' && modal.requestId) {
          setBusyId(modal.requestId)
          await adminRelockWithdrawalHoldAction(modal.requestId, reason)
          toast.success('Withdrawal re-locked')
        } else if (modal.kind === 'reject' && modal.requestId) {
          setBusyId(modal.requestId)
          await rejectWithdrawalQueueItem(modal.requestId, reason)
          toast.success('Withdrawal rejected')
        } else if (modal.kind === 'bulkReject') {
          const result = await bulkRejectWithdrawalsAction(Array.from(selected), reason)
          const ok = result.results.filter((item) => item.success).length
          toast.success(`Rejected ${ok} withdrawal(s)`)
          setSelected(new Set())
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Action failed')
      } finally {
        setBusyId(null)
        setModal(null)
      }
    })
  }

  const handleAction = (
    kind: 'approve' | 'reject' | 'unlock' | 'relock' | 'markPaid',
    requestId: string
  ) => {
    if (kind === 'approve') {
      setBusyId(requestId)
      startTransition(async () => {
        try {
          await approveWithdrawalQueueItem(requestId)
          toast.success('Withdrawal approved')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Approval failed')
        } finally {
          setBusyId(null)
        }
      })
      return
    }
    if (kind === 'markPaid') {
      setBusyId(requestId)
      startTransition(async () => {
        try {
          await markWithdrawalPaidQueueItem(requestId)
          toast.success('Withdrawal marked as paid')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Mark as paid failed')
        } finally {
          setBusyId(null)
        }
      })
      return
    }
    setModal({ kind, requestId })
  }

  const bulkApprove = () => {
    startTransition(async () => {
      const result = await bulkApproveWithdrawalsAction(Array.from(selected))
      const ok = result.results.filter((item) => item.success).length
      toast.success(`Approved ${ok} withdrawal(s)`)
      setSelected(new Set())
    })
  }

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Withdrawal Center"
        description="Manage wallet and capital withdrawals. New requests appear as Pending for immediate review. Approve, then Mark as Paid after sending funds."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, email, address, ID…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0052ff]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="rounded-lg border border-border px-3 py-2 text-sm font-medium">
            Export CSV
          </button>
          {canApproveTransactions && selected.size > 0 ? (
            <>
              <button type="button" onClick={bulkApprove} disabled={isPending} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                Bulk Approve ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => setModal({ kind: 'bulkReject' })}
                disabled={isPending}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
              >
                Bulk Reject ({selected.size})
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {WITHDRAWAL_ADMIN_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium',
              filter === key
                ? 'border-[#0052ff] bg-[#0052ff]/10 text-[#0052ff]'
                : 'border-border bg-card text-muted-foreground'
            )}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{filteredRows.length} result(s)</span>
        <button type="button" onClick={() => toggleSort('requested_at')} className="inline-flex items-center gap-1">
          <ArrowDownUp className="h-3.5 w-3.5" /> Requested
        </button>
        <button type="button" onClick={() => toggleSort('amount_usd')} className="inline-flex items-center gap-1">
          <ArrowDownUp className="h-3.5 w-3.5" /> Amount
        </button>
        <button type="button" onClick={() => toggleSort('risk_score')} className="inline-flex items-center gap-1">
          <ArrowDownUp className="h-3.5 w-3.5" /> Risk
        </button>
      </div>

      <div className="space-y-4">
        {filteredRows.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground">
            No withdrawals match this filter.
          </p>
        ) : (
          filteredRows.map((row) => (
            <WithdrawalCard
              key={`${row.kind}-${row.id}`}
              row={row}
              selected={selected.has(row.id)}
              onToggle={() => toggleSelected(row.id)}
              canApproveTransactions={canApproveTransactions}
              canUnlockWithdrawals={canUnlockWithdrawals}
              onAction={handleAction}
              busyId={busyId}
            />
          ))
        )}
      </div>

      <ReasonModal
        open={modal !== null}
        title={
          modal?.kind === 'unlock'
            ? 'Unlock withdrawal hold'
            : modal?.kind === 'relock'
              ? 'Re-lock withdrawal'
              : 'Reject withdrawal'
        }
        confirmLabel={
          modal?.kind === 'unlock' ? 'Unlock' : modal?.kind === 'relock' ? 'Lock Again' : 'Reject'
        }
        onClose={() => setModal(null)}
        onConfirm={runModalConfirm}
        busy={isPending}
      />
    </div>
  )
}
