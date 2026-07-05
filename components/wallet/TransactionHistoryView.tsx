'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Filter,
  Gift,
  History,
  Search,
  Send,
  TrendingUp,
  Upload,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState, ErrorState } from '@/components/shared/data-state'
import { StatusCardGrid, statusCardSurfaceClass } from '@/components/shared/status-cards'
import { WalletDepositCta, WalletTransferCta } from '@/components/wallet/layout/WalletSidePanels'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useLiveTransactions } from '@/lib/hooks/useLiveTransactions'
import { fetchWalletTransactions } from '@/lib/data/queries'
import type { TransactionItem } from '@/lib/data/types'
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { CustomSelect } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'

const FILTER_TAB_IDS = [
  'all',
  'deposits',
  'withdrawals',
  'transfersSent',
  'transfersReceived',
  'internal',
] as const

type FilterTabId = (typeof FILTER_TAB_IDS)[number]

const TAB_LABEL_KEYS: Record<FilterTabId, string> = {
  all: 'tabAll',
  deposits: 'tabDeposits',
  withdrawals: 'tabWithdrawals',
  transfersSent: 'tabTransfersSent',
  transfersReceived: 'tabTransfersReceived',
  internal: 'tabInternal',
}

const typeIcons: Record<string, typeof Download> = {
  Deposit: Download,
  Withdrawal: Upload,
  Transfer: Send,
  Bonus: Gift,
  Profit: ArrowDownLeft,
  Investment: TrendingUp,
}

function statusStyles(status: string) {
  const value = status.toLowerCase()
  if (value === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (value === 'failed' || value === 'rejected' || value === 'cancelled') {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-amber-100 text-amber-700'
}

function exportTransactionsCsv(
  rows: TransactionItem[],
  headers: [string, string, string, string, string, string, string]
) {
  const header = headers
  const lines = rows.map((tx) =>
    [tx.type, tx.description ?? '', tx.amount, tx.status, tx.date, tx.time ?? '', tx.referenceId ?? '']
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `primefx-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function TransactionHistoryView() {
  const t = useTranslations('wallet.transactions')
  const tWallet = useTranslations('wallet')
  const user = useSessionUser()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTabId>('all')
  const [page, setPage] = useState(1)
  const perPage = 10

  const { data: transactions = [], loading, error, reload } = useLiveTransactions(
    () => fetchWalletTransactions(),
    { userId: user.id, variant: 'wallet' }
  )

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const tabMatch =
        activeTab === 'all' ||
        (activeTab === 'deposits' && tx.type === 'Deposit') ||
        (activeTab === 'withdrawals' && tx.type === 'Withdrawal') ||
        (activeTab === 'transfersSent' && tx.type === 'Transfer' && !tx.isCredit) ||
        (activeTab === 'transfersReceived' && tx.type === 'Transfer' && tx.isCredit) ||
        (activeTab === 'internal' && tx.type === 'Transfer')

      const matchesStatus = true

      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        tx.description?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        tx.referenceId?.toLowerCase().includes(query)

      return tabMatch && matchesStatus && matchesSearch
    })
  }, [transactions, activeTab, search])

  const summary = useMemo(() => {
    const completed = (type: string, credit?: boolean) =>
      transactions
        .filter(
          (tx) =>
            tx.type === type &&
            tx.status.toLowerCase() === 'completed' &&
            (credit === undefined || tx.isCredit === credit)
        )
        .reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0)

    return {
      deposits: completed('Deposit'),
      withdrawals: completed('Withdrawal'),
      sent: completed('Transfer', false),
      received: completed('Transfer', true),
      total: transactions.length,
    }
  }, [transactions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const hasFilters = search.trim().length > 0 || activeTab !== 'all'
  const isTrulyEmpty = transactions.length === 0

  const copyReference = async (referenceId: string) => {
    try {
      await navigator.clipboard.writeText(referenceId)
      toast.success(t('referenceCopied'))
    } catch {
      toast.error(t('referenceCopyFailed'))
    }
  }

  const csvHeaders: [string, string, string, string, string, string, string] = [
    t('type'),
    t('descriptionCol'),
    t('amount'),
    t('status'),
    t('dateTime'),
    t('dateTime'),
    t('reference'),
  ]

  if (loading && !transactions.length) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={6} cols={6} />
      </div>
    )
  }

  if (error && isTrulyEmpty) {
    return (
      <div className="space-y-6">
        <WalletPageHeader title={t('title')} description={t('description')} />
        <ErrorState title={t('loadError')} description={error} onRetry={reload} />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      <WalletPageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                if (!filtered.length) {
                  toast.error(t('nothingToExport'))
                  return
                }
                exportTransactionsCsv(filtered, csvHeaders)
                toast.success(t('exported'))
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {t('export')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Filter className="h-4 w-4" />
              {t('filter')}
            </button>
          </>
        }
      />

      <StatusCardGrid columns={5}>
        {[
          { label: t('totalDeposits'), value: summary.deposits, icon: ArrowDownLeft, tone: 'text-[#0052ff]' },
          { label: t('totalWithdrawals'), value: summary.withdrawals, icon: ArrowUpRight, tone: 'text-emerald-600' },
          { label: t('transfersSent'), value: summary.sent, icon: Send, tone: 'text-blue-600' },
          { label: t('transfersReceived'), value: summary.received, icon: ArrowLeftRight, tone: 'text-orange-600' },
          { label: t('totalTransactions'), value: summary.total, icon: ArrowLeftRight, tone: 'text-[#0052ff]', isCount: true },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={statusCardSurfaceClass}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-gray-500 sm:text-xs">{card.label}</p>
                  <p className="mt-1 text-base font-bold text-gray-900 sm:text-xl">
                    {card.isCount
                      ? card.value
                      : `$${Number(card.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  </p>
                </div>
                <Icon className={cn('h-4 w-4 shrink-0 sm:h-5 sm:w-5', card.tone)} />
              </div>
            </div>
          )
        })}
      </StatusCardGrid>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTER_TAB_IDS.map((tabId) => (
              <button
                key={tabId}
                type="button"
                onClick={() => {
                  setActiveTab(tabId)
                  setPage(1)
                }}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium',
                  activeTab === tabId
                    ? 'bg-[#0052ff] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {t(TAB_LABEL_KEYS[tabId])}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full min-w-[180px] bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <AsyncState
          loading={loading && !transactions.length}
          error={error}
          onRetry={reload}
          isEmpty={paged.length === 0}
          emptyIcon={History}
          emptyTitle={isTrulyEmpty ? t('noTransactionsTitle') : t('noMatchingTitle')}
          emptyDescription={
            isTrulyEmpty
              ? t('emptyFundWallet')
              : hasFilters
                ? t('emptyTrySearch')
                : t('emptyNoFilter')
          }
          emptyAction={
            isTrulyEmpty ? (
              <div className="flex flex-wrap justify-center gap-2">
                <WalletDepositCta />
                <WalletTransferCta />
              </div>
            ) : undefined
          }
          errorTitle={t('loadError')}
          skeleton={<TableSkeleton rows={6} cols={5} />}
        >
          <ScrollTable>
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">{t('dateTime')}</th>
                  <th className="px-4 py-3">{t('type')}</th>
                  <th className="px-4 py-3">{t('descriptionCol')}</th>
                  <th className="px-4 py-3">{t('reference')}</th>
                  <th className="px-4 py-3 text-right">{t('amount')}</th>
                  <th className="px-4 py-3">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((tx) => {
                  const Icon = typeIcons[tx.type] ?? (tx.isCredit ? ArrowDownLeft : ArrowUpRight)
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <p className="font-medium text-gray-900">{tx.date}</p>
                        {tx.time ? <p className="text-xs text-gray-400">{tx.time}</p> : null}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          <Icon className="h-3.5 w-3.5" />
                          {walletTxTypeLabel(tWallet, tx.type)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        {tx.referenceId ? (
                          <button
                            type="button"
                            onClick={() => copyReference(tx.referenceId!)}
                            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#0052ff]"
                          >
                            <Copy className="h-3 w-3" />
                            {tx.referenceId}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={cn('px-4 py-4 text-right text-sm font-bold', tx.isCredit ? 'text-emerald-600' : 'text-gray-900')}>
                        {tx.amount}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', statusStyles(tx.status))}>
                          {tx.status.toLowerCase() === 'completed' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : tx.status.toLowerCase() === 'failed' ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {walletTxStatusLabel(tWallet, tx.status)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollTable>
        </AsyncState>

        <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {t('showing', {
              from: (page - 1) * perPage + 1,
              to: Math.min(page * perPage, filtered.length),
              total: filtered.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {t('prev')}
            </button>
            <span className="text-sm text-gray-600">
              {t('pageOf', { page, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {t('next')}
            </button>
            <CustomSelect
              value={String(perPage)}
              onValueChange={() => {}}
              options={[{ value: '10', label: t('perPage', { count: 10 }) }]}
              size="sm"
              className="min-w-[7rem]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
