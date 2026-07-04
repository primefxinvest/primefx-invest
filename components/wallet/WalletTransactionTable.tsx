'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  ChevronDown,
  Copy,
  Download,
  Gift,
  Send,
  Upload,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { WalletDepositCta, WalletTransferCta } from '@/components/wallet/layout/WalletSidePanels'
import { TableSkeleton } from '@/components/shared/skeletons'
import { ScrollTable } from '@/components/shared/ScrollTable'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { useLiveTransactions } from '@/lib/hooks/useLiveTransactions'
import { fetchWalletTransactions } from '@/lib/data/queries'
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { cn } from '@/lib/utils'

type TxType = 'All' | 'Deposit' | 'Withdrawal' | 'Transfer' | 'Bonus'

const tabs: TxType[] = ['All', 'Deposit', 'Withdrawal', 'Transfer', 'Bonus']

const typeIcons = {
  Deposit: Download,
  Withdrawal: Upload,
  Transfer: Send,
  Bonus: Gift,
} as const

const typeColors = {
  Deposit: 'bg-emerald-100 text-emerald-600',
  Withdrawal: 'bg-red-100 text-red-600',
  Transfer: 'bg-blue-100 text-blue-600',
  Bonus: 'bg-purple-100 text-purple-600',
} as const

type KnownTxType = keyof typeof typeIcons

function getTransactionIcon(type: string) {
  return typeIcons[type as KnownTxType] ?? Download
}

function getTransactionColor(type: string) {
  return typeColors[type as KnownTxType] ?? 'bg-gray-100 text-gray-600'
}

const PREVIEW_LIMIT = 5

export default function WalletTransactionTable() {
  const t = useTranslations('wallet.transactions')
  const tWallet = useTranslations('wallet')
  const user = useSessionUser()
  const [activeTab, setActiveTab] = useState<TxType>('All')
  const { data: walletTransactions = [], loading, error, reload } = useLiveTransactions(
    () => fetchWalletTransactions(),
    { userId: user.id, variant: 'wallet' }
  )

  const tabLabels: Record<TxType, string> = {
    All: t('tabAllShort'),
    Deposit: t('tabDeposit'),
    Withdrawal: t('tabWithdrawal'),
    Transfer: t('tabTransfer'),
    Bonus: t('tabBonus'),
  }

  const filtered = useMemo(() => {
    if (activeTab === 'All') return walletTransactions
    return walletTransactions.filter((tx) => tx.type === activeTab)
  }, [activeTab, walletTransactions])

  const previewRows = useMemo(() => filtered.slice(0, PREVIEW_LIMIT), [filtered])
  const hasMoreRows = filtered.length > PREVIEW_LIMIT

  const copyReference = async (referenceId: string) => {
    try {
      await navigator.clipboard.writeText(referenceId)
      toast.success(t('referenceIdCopied'))
    } catch {
      toast.error(t('referenceIdCopyFailed'))
    }
  }

  const isTrulyEmpty = walletTransactions.length === 0
  const hasFilter = activeTab !== 'All'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold text-gray-900">{t('tableTitle')}</h2>
        <Link
          href="/transactions"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-[#0052ff] transition-colors hover:bg-gray-50"
        >
          {t('viewAll')}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              activeTab === tab
                ? 'bg-[#0052ff] text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <AsyncState
        loading={loading && walletTransactions.length === 0}
        error={error}
        onRetry={reload}
        isEmpty={previewRows.length === 0}
        emptyTitle={isTrulyEmpty ? t('noTransactionsTitle') : t('noMatchingTitle')}
        emptyDescription={
          isTrulyEmpty
            ? t('emptyFundWallet')
            : hasFilter
              ? t('emptyTryTab')
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
        skeleton={<TableSkeleton rows={5} cols={6} />}
        compact
      >
        <ScrollTable className="mt-4">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="pb-3 pr-4 font-semibold">{t('dateTime')}</th>
                <th className="pb-3 pr-4 font-semibold">{t('type')}</th>
                <th className="pb-3 pr-4 font-semibold">{t('descriptionCol')}</th>
                <th className="pb-3 pr-4 font-semibold">{t('amount')}</th>
                <th className="pb-3 pr-4 font-semibold">{t('status')}</th>
                <th className="pb-3 font-semibold">{t('referenceId')}</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((tx) => {
                const Icon = getTransactionIcon(tx.type)
                const isPositive = tx.amount.startsWith('+')

                return (
                  <tr key={tx.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3.5 pr-4">
                      <p className="text-xs font-medium text-gray-900">{tx.date}</p>
                      <p className="text-[11px] text-gray-400">{tx.time}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', getTransactionColor(tx.type))}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {walletTxTypeLabel(tWallet, tx.type)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-gray-600">{tx.description}</td>
                    <td
                      className={cn(
                        'py-3.5 pr-4 text-xs font-semibold',
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {tx.amount}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                          tx.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-orange-700'
                        )}
                      >
                        {walletTxStatusLabel(tWallet, tx.status)}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {tx.referenceId ? (
                        <button
                          type="button"
                          onClick={() => copyReference(tx.referenceId!)}
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-[#0052ff]"
                        >
                          {tx.referenceId}
                          <Copy className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </ScrollTable>
      </AsyncState>

      {hasMoreRows ? (
        <Link
          href="/transactions"
          className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-[#0052ff] hover:underline"
        >
          {t('viewAll')} ({filtered.length})
          <ChevronDown className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}
