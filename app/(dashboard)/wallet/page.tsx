'use client'

import { Settings } from 'lucide-react'
import { toast } from 'sonner'
import WalletBalanceCards from '@/components/wallet/WalletBalanceCards'
import WalletActionCards from '@/components/wallet/WalletActionCards'
import WalletBalanceDonut from '@/components/wallet/WalletBalanceDonut'
import WalletHealthCard from '@/components/wallet/WalletHealthCard'
import WalletPrimeAIInsight from '@/components/wallet/WalletPrimeAIInsight'
import WalletTransactionTable from '@/components/wallet/WalletTransactionTable'
import WalletActivitySummary from '@/components/wallet/WalletActivitySummary'
import PaymentMethodsCard from '@/components/wallet/PaymentMethodsCard'

export default function WalletPage() {
  const handleSettings = () => {
    toast.info('Wallet settings', {
      description: 'Configure limits, notifications, and security preferences.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your funds, track balances, and perform secure transactions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSettings}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          Wallet Settings
        </button>
      </div>

      <WalletBalanceCards />

      <WalletActionCards />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WalletBalanceDonut />
        <WalletHealthCard />
        <WalletPrimeAIInsight />
      </div>

      <WalletTransactionTable />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <WalletActivitySummary />
        <PaymentMethodsCard />
      </div>
    </div>
  )
}
