'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Calendar,
  ChevronDown,
  Copy,
  Download,
  Gift,
  Send,
  SlidersHorizontal,
  Upload,
} from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletTransactions } from '@/lib/data/queries'
import { cn } from '@/lib/utils'

type TxType = 'All' | 'Deposit' | 'Withdrawal' | 'Transfer' | 'Bonus'

const tabs: TxType[] = ['All', 'Deposit', 'Withdrawal', 'Transfer', 'Bonus']

const typeIcons = {
  Deposit: Download,
  Withdrawal: Upload,
  Transfer: Send,
  Bonus: Gift,
}

const typeColors = {
  Deposit: 'bg-emerald-100 text-emerald-600',
  Withdrawal: 'bg-red-100 text-red-600',
  Transfer: 'bg-blue-100 text-blue-600',
  Bonus: 'bg-purple-100 text-purple-600',
}

export default function WalletTransactionTable() {
  const [activeTab, setActiveTab] = useState<TxType>('All')
  const { data: walletTransactions = [], loading, error, reload } = useAsyncData(
    () => fetchWalletTransactions(),
    []
  )

  const filtered = useMemo(() => {
    if (activeTab === 'All') return walletTransactions
    return walletTransactions.filter((tx) => tx.type === activeTab)
  }, [activeTab, walletTransactions])

  const copyReference = async (referenceId: string) => {
    try {
      await navigator.clipboard.writeText(referenceId)
      toast.success('Reference ID copied')
    } catch {
      toast.error('Failed to copy reference ID')
    }
  }

  const handleExport = () => {
    toast.success('Export started', {
      description: 'Your transaction history will download shortly.',
    })
  }

  const handleFilter = () => {
    toast.info('Filters', { description: 'Advanced filters coming soon.' })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-sm font-bold text-gray-900">Transaction History</h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
            <Calendar className="h-3.5 w-3.5" />
            May 10, 2024 – Jun 10, 2024
          </div>
          <button
            type="button"
            onClick={handleFilter}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-gray-100 pb-4">
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
            {tab}
          </button>
        ))}
      </div>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={filtered.length === 0}
        emptyTitle="No transactions found"
        emptyDescription="Your wallet activity will appear here once you deposit or invest."
        skeleton={<TableSkeleton rows={5} cols={6} />}
        compact
      >
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="pb-3 pr-4 font-semibold">Date & Time</th>
                <th className="pb-3 pr-4 font-semibold">Type</th>
                <th className="pb-3 pr-4 font-semibold">Description</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Reference ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
              const Icon = typeIcons[tx.type]
              const isPositive = tx.amount.startsWith('+')

              return (
                <tr key={tx.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3.5 pr-4">
                    <p className="text-xs font-medium text-gray-900">{tx.date}</p>
                    <p className="text-[11px] text-gray-400">{tx.time}</p>
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', typeColors[tx.type])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{tx.type}</span>
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
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <button
                      type="button"
                      onClick={() => copyReference(tx.referenceId)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-[#0052ff]"
                    >
                      {tx.referenceId}
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      </AsyncState>

      <Link
        href="/transactions"
        className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-[#0052ff] hover:underline"
      >
        View All Transactions
        <ChevronDown className="h-4 w-4" />
      </Link>
    </div>
  )
}
