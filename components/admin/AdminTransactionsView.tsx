'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminDepositSettlementPanel } from '@/components/admin/AdminDepositSettlementPanel'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusCardGrid, statusCardAdminSurfaceClass } from '@/components/shared/status-cards'
import { Button } from '@/components/ui/button'
import { updateTransactionStatus, processDueFinancialJobsAction } from '@/lib/admin/actions'
import type { AdminTransactionRow } from '@/lib/admin/types'
import { patchAdminTransactionRow } from '@/lib/data/transaction-map'
import { formatCurrency } from '@/lib/data/format'
import { useActionDialog } from '@/lib/hooks/useActionDialog'
import { useAdminTransactionsRealtime } from '@/lib/hooks/useTransactionsRealtime'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'pending' | 'completed' | 'failed'

function formatTransactionDate(value: string) {
  const date = new Date(value)
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
  return { datePart, timePart }
}

function getTypeMeta(type: string) {
  const normalized = type.toLowerCase()
  switch (normalized) {
    case 'deposit':
      return {
        label: 'Deposit',
        icon: ArrowDownLeft,
        badgeClass: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        amountClass: 'text-emerald-700',
      }
    case 'withdrawal':
      return {
        label: 'Withdrawal',
        icon: ArrowUpRight,
        badgeClass: 'bg-orange-50 text-orange-700 ring-orange-100',
        amountClass: 'text-orange-700',
      }
    case 'bonus':
      return {
        label: 'Bonus',
        icon: Gift,
        badgeClass: 'bg-violet-50 text-violet-700 ring-violet-100',
        amountClass: 'text-violet-700',
      }
    case 'profit':
      return {
        label: 'Profit',
        icon: TrendingUp,
        badgeClass: 'bg-blue-50 text-blue-700 ring-blue-100',
        amountClass: 'text-blue-700',
      }
    case 'referral':
      return {
        label: 'Referral',
        icon: Share2,
        badgeClass: 'bg-amber-50 text-amber-700 ring-amber-100',
        amountClass: 'text-amber-700',
      }
    case 'investment':
      return {
        label: 'Capital',
        icon: Briefcase,
        badgeClass: 'bg-sky-50 text-sky-700 ring-sky-100',
        amountClass: 'text-sky-700',
      }
    default:
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        icon: ArrowDownLeft,
        badgeClass: 'bg-slate-50 text-slate-700 ring-slate-100',
        amountClass: 'text-foreground',
      }
  }
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const config =
    normalized === 'completed' || normalized === 'completed_partial'
      ? {
          icon: CheckCircle2,
          className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        }
      : normalized === 'pending'
        ? {
            icon: Clock,
            className: 'bg-amber-50 text-amber-700 ring-amber-100',
          }
        : {
            icon: XCircle,
            className: 'bg-red-50 text-red-700 ring-red-100',
          }

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset sm:px-2.5 sm:text-xs',
        config.className
      )}
    >
      <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
      {normalized === 'completed_partial' ? 'Completed (Partial)' : status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const meta = getTypeMeta(type)
  const Icon = meta.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset sm:px-2.5 sm:text-xs',
        meta.badgeClass
      )}
    >
      <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
      {meta.label}
    </span>
  )
}

function TransactionUserCell({ tx }: { tx: AdminTransactionRow }) {
  const displayName = tx.user_name?.trim() || 'Unknown user'
  const avatarSrc = getDefaultAvatarUrl(tx.user_email || tx.user_id)

  return (
    <Link
      href={`/admin/users/${tx.user_id}`}
      className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90 sm:gap-3"
    >
      <img
        src={avatarSrc}
        alt={displayName}
        className="h-8 w-8 shrink-0 rounded-full border border-border bg-muted object-cover sm:h-9 sm:w-9"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground hover:text-primary">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">{tx.user_email}</p>
      </div>
    </Link>
  )
}

function ReferenceCell({ reference }: { reference: string }) {
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      toast.success('Reference copied')
    } catch {
      toast.error('Could not copy reference')
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs"
        title={reference}
      >
        {reference}
      </span>
      <button
        type="button"
        onClick={copyReference}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        title="Copy reference"
        aria-label="Copy reference"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function getTransactionActionMeta(tx: AdminTransactionRow) {
  const type = tx.type.toLowerCase()
  const amount = formatCurrency(tx.amount)

  switch (type) {
    case 'deposit':
      return {
        approveTitle: 'Approve deposit',
        approveDescription: `Credit ${amount} to the user's available wallet balance once you confirm this deposit.`,
        rejectTitle: 'Reject deposit',
        rejectDescription: `Reject this deposit request. No funds will be added to the user's wallet.`,
        rejectNote: 'The user will not receive any balance from this deposit.',
        reviewHint: 'Confirm the incoming transfer before crediting the wallet.',
      }
    case 'withdrawal':
      return {
        approveTitle: 'Approve withdrawal',
        approveDescription: `Confirm this withdrawal of ${amount}. Use this only when the payout has been verified or scheduled.`,
        rejectTitle: 'Reject withdrawal',
        rejectDescription: `Reject this withdrawal. The held amount (${amount}) will be returned to the user's available balance immediately.`,
        rejectNote: 'Funds held for this withdrawal will be released back to the wallet.',
        reviewHint: 'Rejecting returns held funds to the user\'s available balance.',
      }
    case 'investment':
      return {
        approveTitle: 'Approve capital return',
        approveDescription: `Release ${amount} from the investment back to the user's wallet and close the related position.`,
        rejectTitle: 'Cancel capital withdrawal',
        rejectDescription: `Cancel this capital withdrawal request. The ${amount} will remain invested — nothing is moved to the wallet.`,
        rejectNote: 'Capital stays in the investment; the withdrawal request will be cancelled.',
        reviewHint: 'Rejecting keeps capital invested and cancels the withdrawal request.',
      }
    default:
      return {
        approveTitle: 'Approve transaction',
        approveDescription: `Approve this ${type} transaction of ${amount}.`,
        rejectTitle: 'Reject transaction',
        rejectDescription: `Reject this ${type} transaction of ${amount}.`,
        rejectNote: null,
        reviewHint: 'Review this transaction before approving or rejecting.',
      }
  }
}

function TransactionActionPlaceholder({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  if (normalized === 'completed') {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden xl:inline">Processed</span>
      </span>
    )
  }

  if (['failed', 'rejected', 'cancelled'].includes(normalized)) {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-medium text-red-600">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden xl:inline capitalize">{normalized}</span>
      </span>
    )
  }

  return <span className="text-xs text-muted-foreground">—</span>
}

function TransactionActionButtons({
  tx,
  isProcessing,
  processingAction,
  onApprove,
  onReject,
  layout = 'inline',
  canMutate = false,
}: {
  tx: AdminTransactionRow
  isProcessing: boolean
  processingAction: 'approve' | 'reject' | null
  onApprove: () => void
  onReject: () => void
  layout?: 'inline' | 'stacked'
  canMutate?: boolean
}) {
  if (tx.status.toLowerCase() !== 'pending') {
    return <TransactionActionPlaceholder status={tx.status} />
  }

  if (!canMutate) {
    return <span className="text-xs text-muted-foreground">View only</span>
  }

  const isStacked = layout === 'stacked'

  return (
    <div
      className={cn(
        'flex gap-1.5',
        isStacked
          ? 'w-full flex-col sm:flex-row'
          : 'min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-end flex-col items-stretch'
      )}
      role="group"
      aria-label="Transaction review actions"
    >
      <Button
        type="button"
        size="sm"
        disabled={isProcessing}
        onClick={onApprove}
        className={cn(
          'bg-emerald-600 text-white hover:bg-emerald-700',
          isStacked ? 'flex-1' : 'w-full min-[1100px]:w-auto'
        )}
      >
        {isProcessing && processingAction === 'approve' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isProcessing}
        onClick={onReject}
        className={isStacked ? 'flex-1' : 'w-full min-[1100px]:w-auto'}
      >
        {isProcessing && processingAction === 'reject' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        Reject
      </Button>
    </div>
  )
}

export function AdminTransactionsView({
  transactions: initialTransactions,
  canApproveDeposits = false,
  canApproveWithdrawals = false,
  /** @deprecated Prefer canApproveDeposits / canApproveWithdrawals */
  canApproveTransactions,
}: {
  transactions: AdminTransactionRow[]
  canApproveDeposits?: boolean
  canApproveWithdrawals?: boolean
  canApproveTransactions?: boolean
}) {
  const depositsAllowed = canApproveDeposits || canApproveTransactions === true
  const withdrawalsAllowed = canApproveWithdrawals || canApproveTransactions === true

  function canMutateTransaction(tx: AdminTransactionRow): boolean {
    const type = tx.type.toLowerCase()
    if (type === 'deposit' || type === 'bonus' || type === 'profit') {
      return depositsAllowed
    }
    return withdrawalsAllowed
  }

  const [rows, setRows] = useState(initialTransactions)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null)
  const [processingDueJobs, setProcessingDueJobs] = useState(false)
  const [, startTransition] = useTransition()
  const { confirm, ActionDialog } = useActionDialog()

  useEffect(() => {
    setRows(initialTransactions)
  }, [initialTransactions])

  const upsertAdminTransaction = useCallback(async (
    row: {
      id: string
      user_id?: string | null
      type?: string | null
      amount?: unknown
      status?: string | null
      description?: string | null
      reference_id?: string | null
      created_at: string
    },
    eventType: 'INSERT' | 'UPDATE'
  ) => {
    if (eventType === 'UPDATE') {
      setRows((current) =>
        current.map((tx) =>
          tx.id === row.id
            ? patchAdminTransactionRow(tx, {
                id: row.id,
                type: row.type,
                amount: row.amount as string | number | null | undefined,
                status: row.status,
                description: row.description,
                reference_id: row.reference_id,
                created_at: row.created_at,
              })
            : tx
        )
      )
      return
    }

    try {
      const response = await fetch(`/api/admin/transactions/${encodeURIComponent(row.id)}`)
      const payload = (await response.json()) as {
        transaction?: AdminTransactionRow
        error?: string
      }
      if (!response.ok || !payload.transaction) return

      setRows((current) => [
        payload.transaction!,
        ...current.filter((tx) => tx.id !== payload.transaction!.id),
      ])
    } catch {
      // Ignore enrichment failures; admin can refresh manually
    }
  }, [])

  useAdminTransactionsRealtime({
    onInsert: (row) => {
      void upsertAdminTransaction(row, 'INSERT')
    },
    onUpdate: (row) => {
      void upsertAdminTransaction(row, 'UPDATE')
    },
  })

  const transactions = rows

  const types = useMemo(
    () => [...new Set(transactions.map((tx) => tx.type.toLowerCase()))].sort(),
    [transactions]
  )

  const stats = useMemo(() => {
    const pendingCount = transactions.filter((tx) => tx.status.toLowerCase() === 'pending').length
    const completedCount = transactions.filter((tx) =>
      ['completed', 'completed_partial'].includes(tx.status.toLowerCase())
    ).length
    const failedCount = transactions.filter((tx) =>
      ['failed', 'rejected'].includes(tx.status.toLowerCase())
    ).length
    const depositVolume = transactions
      .filter((tx) => ['deposit', 'bonus', 'profit'].includes(tx.type.toLowerCase()))
      .reduce((sum, tx) => sum + tx.amount, 0)
    const withdrawalVolume = transactions
      .filter((tx) => tx.type.toLowerCase() === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0)

    return {
      total: transactions.length,
      pending: pendingCount,
      completed: completedCount,
      failed: failedCount,
      depositVolume,
      withdrawalVolume,
    }
  }, [transactions])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return transactions.filter((tx) => {
      const status = tx.status.toLowerCase()

      if (statusFilter === 'pending' && status !== 'pending') return false
      if (statusFilter === 'completed' && !['completed', 'completed_partial'].includes(status)) return false
      if (statusFilter === 'failed' && !['failed', 'rejected'].includes(status)) return false
      if (typeFilter !== 'all' && tx.type.toLowerCase() !== typeFilter) return false

      if (!term) return true

      return (
        tx.user_email.toLowerCase().includes(term) ||
        (tx.user_name?.toLowerCase().includes(term) ?? false) ||
        tx.type.toLowerCase().includes(term) ||
        (tx.reference_id?.toLowerCase().includes(term) ?? false) ||
        tx.id.toLowerCase().includes(term)
      )
    })
  }, [search, statusFilter, typeFilter, transactions])

  const runStatusUpdate = (tx: AdminTransactionRow, status: 'Completed' | 'Rejected') => {
    setProcessingId(tx.id)
    startTransition(async () => {
      try {
        await updateTransactionStatus(tx.id, status)
        const type = tx.type.toLowerCase()
        if (status === 'Completed') {
          if (type === 'deposit' || type === 'bonus' || type === 'profit') {
            toast.success('Transaction approved — wallet balance updated')
          } else {
            toast.success('Transaction approved')
          }
        } else if (type === 'withdrawal') {
          toast.success('Withdrawal rejected — funds returned to wallet')
        } else if (type === 'investment') {
          toast.success('Capital withdrawal cancelled — funds remain invested')
        } else {
          toast.success('Transaction rejected')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update transaction')
      } finally {
        setProcessingId(null)
        setProcessingAction(null)
      }
    })
  }

  const handleApprove = async (tx: AdminTransactionRow) => {
    if (!canMutateTransaction(tx)) {
      toast.error(
        tx.type.toLowerCase() === 'deposit' ||
          tx.type.toLowerCase() === 'bonus' ||
          tx.type.toLowerCase() === 'profit'
          ? "You don't have permission to approve deposits."
          : 'You do not have permission to approve this transaction.'
      )
      return
    }
    const meta = getTransactionActionMeta(tx)
    const confirmed = await confirm({
      title: meta.approveTitle,
      description: meta.approveDescription,
      confirmLabel: 'Approve',
    })
    if (!confirmed) return
    setProcessingAction('approve')
    runStatusUpdate(tx, 'Completed')
  }

  const handleReject = async (tx: AdminTransactionRow) => {
    if (!canMutateTransaction(tx)) {
      toast.error(
        tx.type.toLowerCase() === 'deposit' ||
          tx.type.toLowerCase() === 'bonus' ||
          tx.type.toLowerCase() === 'profit'
          ? "You don't have permission to approve deposits."
          : 'You do not have permission to reject this transaction.'
      )
      return
    }
    const meta = getTransactionActionMeta(tx)
    const description = meta.rejectNote
      ? `${meta.rejectDescription} ${meta.rejectNote}`
      : meta.rejectDescription

    const confirmed = await confirm({
      title: meta.rejectTitle,
      description,
      confirmLabel: 'Reject',
      cancelLabel: 'Keep pending',
      destructive: true,
    })
    if (!confirmed) return
    setProcessingAction('reject')
    runStatusUpdate(tx, 'Rejected')
  }

  const handleProcessDueJobs = () => {
    setProcessingDueJobs(true)
    startTransition(async () => {
      try {
        const result = await processDueFinancialJobsAction()
        const walletDone = result.withdrawals.processed
        const capitalDone = result.capitalWithdrawals.processed
        const depositsDone = result.depositSync.completed

        toast.success('Due financial jobs processed', {
          description: `${walletDone} wallet withdrawal(s), ${capitalDone} capital return(s), ${depositsDone} deposit(s) confirmed.`,
        })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to process due jobs')
      } finally {
        setProcessingDueJobs(false)
      }
    })
  }

  const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'failed', label: 'Failed', count: stats.failed },
  ]

  return (
    <div className="min-w-0 space-y-6">
      <ActionDialog />
      <AdminPageHeader
        title="Transaction Management"
        description="Review, approve, and monitor platform transactions"
      />

      <StatusCardGrid columns={4}>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Total</p>
          <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stats.total}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">All transactions</p>
        </div>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Pending</p>
          <p className="mt-1 text-lg font-bold text-amber-600 sm:mt-2 sm:text-2xl">{stats.pending}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">Awaiting review</p>
        </div>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Completed</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 sm:mt-2 sm:text-2xl">{stats.completed}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">Successfully processed</p>
        </div>
        <div className={statusCardAdminSurfaceClass}>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">Failed</p>
          <p className="mt-1 text-lg font-bold text-red-600 sm:mt-2 sm:text-2xl">{stats.failed}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">Rejected or failed</p>
        </div>
      </StatusCardGrid>

      <StatusCardGrid columns={2} className="xl:grid-cols-2">
        <div className={cn(statusCardAdminSurfaceClass, 'flex items-center justify-between gap-3')}>
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <ArrowDownLeft className="h-4 w-4 shrink-0" />
            <span className="text-[11px] sm:text-sm">Inflow volume</span>
          </div>
          <span className="text-sm font-bold tabular-nums text-emerald-700 sm:text-base">
            {formatCurrency(stats.depositVolume)}
          </span>
        </div>
        <div className={cn(statusCardAdminSurfaceClass, 'flex items-center justify-between gap-3')}>
          <div className="flex items-center gap-2 text-sm text-orange-800">
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            <span className="text-[11px] sm:text-sm">Outflow volume</span>
          </div>
          <span className="text-sm font-bold tabular-nums text-orange-700 sm:text-base">
            {formatCurrency(stats.withdrawalVolume)}
          </span>
        </div>
      </StatusCardGrid>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:max-w-md sm:px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, type, or reference…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
          >
            <option value="all">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
              statusFilter === filter.key
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            {filter.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px]',
                statusFilter === filter.key ? 'bg-white/20' : 'bg-background'
              )}
            >
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {stats.pending > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm text-amber-900 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>
                <span className="font-semibold">{stats.pending} pending</span>
                {' — '}
                {statusFilter !== 'pending'
                  ? 'Review manual deposits in the Pending tab, or run due jobs for withdrawals past the 7-day notice.'
                  : 'Approve bank deposits manually. Withdrawals and capital returns auto-complete after the notice period when cron runs.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:ml-auto">
            {depositsAllowed ? (
              <button
                type="button"
                disabled={processingDueJobs}
                onClick={handleProcessDueJobs}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60"
              >
                {processingDueJobs ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Process due jobs
              </button>
            ) : null}
            {statusFilter !== 'pending' ? (
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Review pending
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className={cn(statusCardAdminSurfaceClass, 'py-10 text-center text-sm text-muted-foreground')}>
            No transactions found.
          </div>
        ) : (
          filtered.map((tx) => {
            const meta = getTypeMeta(tx.type)
            const { datePart, timePart } = formatTransactionDate(tx.created_at)
            const reference = tx.reference_id || tx.id.slice(0, 8)
            const isPending = tx.status.toLowerCase() === 'pending'

            return (
              <article
                key={tx.id}
                className={cn(
                  statusCardAdminSurfaceClass,
                  isPending && 'border-l-2 border-l-amber-400 bg-amber-50/20'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge type={tx.type} />
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="mt-2">
                      <TransactionUserCell tx={tx} />
                    </div>
                    <div className="mt-2">
                      <ReferenceCell reference={reference} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {datePart} · {timePart}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-base font-bold tabular-nums', meta.amountClass)}>
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>

                {tx.type.toLowerCase() === 'deposit' ? (
                  <AdminDepositSettlementPanel referenceId={tx.reference_id} />
                ) : null}

                {isPending ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {getTransactionActionMeta(tx).reviewHint}
                    </p>
                    <TransactionActionButtons
                      tx={tx}
                      isProcessing={processingId === tx.id}
                      processingAction={processingId === tx.id ? processingAction : null}
                      onApprove={() => void handleApprove(tx)}
                      onReject={() => void handleReject(tx)}
                      layout="stacked"
                      canMutate={canMutateTransaction(tx)}
                    />
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden min-w-0 overflow-hidden rounded-lg border border-border bg-card md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '16%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:px-4">
                Reference
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:px-3">
                User
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Type
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Status
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Date
              </th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold sm:px-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const meta = getTypeMeta(tx.type)
                const { datePart, timePart } = formatTransactionDate(tx.created_at)
                const reference = tx.reference_id || tx.id.slice(0, 8)
                const isPending = tx.status.toLowerCase() === 'pending'

                return (
                  <tr
                    key={tx.id}
                    className={cn(
                      'transition-colors hover:bg-background/80',
                      isPending && 'border-l-2 border-l-amber-400 bg-amber-50/20'
                    )}
                  >
                    <td className="overflow-hidden px-3 py-3 sm:px-4">
                      <ReferenceCell reference={reference} />
                    </td>
                    <td className="overflow-hidden px-2 py-3 sm:px-3">
                      <TransactionUserCell tx={tx} />
                    </td>
                    <td className="px-2 py-3">
                      <TypeBadge type={tx.type} />
                    </td>
                    <td className="px-2 py-3">
                      <span className={cn('text-sm font-semibold tabular-nums', meta.amountClass)}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-2 py-3">
                      <p className="whitespace-nowrap text-xs text-foreground">{datePart}</p>
                      <p className="whitespace-nowrap text-[11px] text-muted-foreground">{timePart}</p>
                    </td>
                    <td className="px-2 py-3 text-right sm:px-3">
                      <TransactionActionButtons
                        tx={tx}
                        isProcessing={processingId === tx.id}
                        processingAction={processingId === tx.id ? processingAction : null}
                        onApprove={() => void handleApprove(tx)}
                        onReject={() => void handleReject(tx)}
                        canMutate={canMutateTransaction(tx)}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
