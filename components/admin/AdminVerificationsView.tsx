'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { StatusCardGrid, statusCardAdminSurfaceClass } from '@/components/shared/status-cards'
import {
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogViewport,
} from '@/components/ui/dialog'
import type {
  AdminVerificationSessionRow,
  AdminVerificationSessionsResult,
} from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  'all',
  'Not Started',
  'In Progress',
  'In Review',
  'Approved',
  'Declined',
  'Abandoned',
  'Expired',
  'KYC Expired',
] as const

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    case 'Declined':
      return 'bg-red-50 text-red-700 ring-red-100'
    case 'In Review':
      return 'bg-amber-50 text-amber-700 ring-amber-100'
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 ring-blue-100'
    case 'Abandoned':
    case 'Expired':
    case 'KYC Expired':
    case 'Not Started':
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-100'
  }
}

async function fetchWithRetry(url: string, init?: RequestInit, attempts = 4): Promise<Response> {
  let lastResponse: Response | null = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, init)
    lastResponse = response
    if (response.status !== 429 || attempt === attempts - 1) {
      return response
    }
    const retryAfter = Number(response.headers.get('Retry-After') || 0)
    const delayMs = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return lastResponse!
}

function SessionIdCell({ sessionId }: { sessionId: string }) {
  const [expanded, setExpanded] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId)
      toast.success('Session ID copied')
    } catch {
      toast.error('Could not copy session ID')
    }
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="truncate font-mono text-left text-[11px] text-muted-foreground hover:text-foreground"
        title={sessionId}
      >
        {expanded ? sessionId : `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`}
      </button>
      <button
        type="button"
        onClick={copy}
        className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
      >
        <Copy className="h-3 w-3" />
        Copy
      </button>
    </div>
  )
}

export function AdminVerificationsView({
  initialData,
  initialStatus,
  initialSearch,
  initialPage,
}: {
  initialData: AdminVerificationSessionsResult
  initialStatus: string
  initialSearch: string
  initialPage: number
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialData.rows)
  const [stats, setStats] = useState(initialData.stats)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(initialData.total)
  const [decisionRow, setDecisionRow] = useState<AdminVerificationSessionRow | null>(null)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setRows(initialData.rows)
    setStats(initialData.stats)
    setTotal(initialData.total)
    setPage(initialPage)
    setStatusFilter(initialStatus)
    setSearch(initialSearch)
  }, [initialData, initialPage, initialSearch, initialStatus])

  const totalPages = Math.max(1, Math.ceil(total / initialData.pageSize))

  const applyFilters = useCallback(
    (next: { status?: string; search?: string; page?: number }) => {
      const params = new URLSearchParams()
      const nextStatus = next.status ?? statusFilter
      const nextSearch = next.search ?? search
      const nextPage = next.page ?? page

      if (nextStatus && nextStatus !== 'all') params.set('status', nextStatus)
      if (nextSearch.trim()) params.set('q', nextSearch.trim())
      if (nextPage > 1) params.set('page', String(nextPage))

      router.push(`/admin/verifications${params.toString() ? `?${params.toString()}` : ''}`)
    },
    [page, router, search, statusFilter]
  )

  const updateRow = (session: AdminVerificationSessionRow) => {
    setRows((current) =>
      current.map((row) => (row.session_id === session.session_id ? session : row))
    )
  }

  const refreshRow = async (sessionId: string) => {
    setRowLoadingId(sessionId)
    try {
      const response = await fetchWithRetry(`/api/didit/session/${encodeURIComponent(sessionId)}`)
      const payload = (await response.json()) as {
        session?: AdminVerificationSessionRow
        error?: string
      }
      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? 'Refresh failed')
      }
      updateRow(payload.session)
      toast.success('Session refreshed from Didit')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setRowLoadingId(null)
    }
  }

  const patchStatus = async (sessionId: string, status: 'Approved' | 'Declined') => {
    setRowLoadingId(sessionId)
    try {
      const response = await fetchWithRetry(
        `/api/didit/session/${encodeURIComponent(sessionId)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      )
      const payload = (await response.json()) as {
        session?: AdminVerificationSessionRow
        error?: string
      }
      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? 'Status update failed')
      }
      updateRow(payload.session)
      toast.success(`Session ${status.toLowerCase()}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Status update failed')
    } finally {
      setRowLoadingId(null)
    }
  }

  const bulkRefreshAll = () => {
    startTransition(async () => {
      try {
        setBulkProgress({ done: 0, total: 1 })
        const response = await fetch('/api/didit/sessions/bulk-refresh', { method: 'POST' })
        const payload = (await response.json()) as {
          total?: number
          updated?: number
          failed?: number
          error?: string
        }
        if (!response.ok) throw new Error(payload.error ?? 'Bulk refresh failed')
        setBulkProgress({
          done: payload.updated ?? 0,
          total: payload.total ?? 0,
        })
        toast.success(`Refreshed ${payload.updated ?? 0} of ${payload.total ?? 0} pending sessions`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Bulk refresh failed')
      } finally {
        setBulkProgress(null)
      }
    })
  }

  const statCards = useMemo(
    () => [
      { label: 'Total Sessions', value: stats.total },
      { label: 'Approved', value: stats.approved, className: 'text-emerald-600' },
      { label: 'Declined', value: stats.declined, className: 'text-red-600' },
      { label: 'In Review', value: stats.inReview, className: 'text-amber-600' },
      { label: 'Pending', value: stats.pending, className: 'text-blue-600' },
    ],
    [stats]
  )

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Didit Verification Sessions"
        description="View, refresh, and manually resolve Didit KYC sessions"
      />

      <StatusCardGrid columns={5}>
        {statCards.map((card) => (
          <div key={card.label} className={statusCardAdminSurfaceClass}>
            <p className="text-[11px] font-medium text-muted-foreground sm:text-sm">{card.label}</p>
            <p className={cn('mt-1 text-lg font-bold sm:mt-2 sm:text-2xl', card.className)}>
              {card.value}
            </p>
          </div>
        ))}
      </StatusCardGrid>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters({ search, page: 1 })
              }}
              placeholder="Search session ID or vendor data…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              applyFilters({ status: e.target.value, page: 1 })
            }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All statuses' : option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => applyFilters({ search, status: statusFilter, page: 1 })}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Apply
          </button>
        </div>

        <button
          type="button"
          disabled={pending || bulkProgress !== null}
          onClick={bulkRefreshAll}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {bulkProgress || pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {bulkProgress
            ? `Refreshing ${bulkProgress.done}/${bulkProgress.total}`
            : 'Refresh All Pending'}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Session ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Vendor Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No verification sessions found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const loading = rowLoadingId === row.session_id
                  const inReview = row.status === 'In Review'
                  return (
                    <tr key={row.id} className="hover:bg-background/80">
                      <td className="px-4 py-3">
                        <SessionIdCell sessionId={row.session_id} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-foreground">
                            {row.vendor_data ?? '—'}
                          </p>
                          {row.user_email ? (
                            <p className="truncate text-[11px] text-muted-foreground">
                              {row.user_name || row.user_email}
                            </p>
                          ) : null}
                          {row.user_id ? (
                            <Link
                              href={`/admin/users/${row.user_id}`}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              View user
                            </Link>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                            statusBadgeClass(row.status)
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(row.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(row.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => refreshRow(row.session_id)}
                            title="Refresh from Didit"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-background disabled:opacity-50"
                          >
                            {loading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecisionRow(row)}
                            title="View decision JSON"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-background"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {inReview ? (
                            <>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => patchStatus(row.session_id, 'Approved')}
                                title="Approve"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => patchStatus(row.session_id, 'Declined')}
                                title="Decline"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages} · {total} sessions
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => applyFilters({ page: page - 1 })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => applyFilters({ page: page + 1 })}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DialogRoot open={Boolean(decisionRow)} onOpenChange={(open) => !open && setDecisionRow(null)}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup className="max-w-3xl">
              <DialogClose />
              <DialogTitle>Decision payload</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Session {decisionRow?.session_id}
              </p>
              <pre className="primefx-scrollbar mt-4 max-h-[60vh] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
                {JSON.stringify(decisionRow?.decision ?? {}, null, 2)}
              </pre>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </DialogRoot>
    </div>
  )
}
