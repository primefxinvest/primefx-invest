import { Bitcoin, Clock, Wallet } from 'lucide-react'
import { DEPOSIT_ASSETS } from '@/lib/how-primefx-works/content'
import { CheckList, InfoCard, SectionHeader, SectionShell } from './shared'

const DEPOSIT_POINTS = [
  'Deposits are crypto-only — no bank wire required.',
  'Funds are credited after required blockchain confirmations.',
  'Transaction status is visible in your wallet activity.',
  'Available balance updates automatically once confirmed.',
] as const

export function HowPrimefxDepositSection() {
  return (
    <SectionShell id="deposits">
      <SectionHeader
        eyebrow="Wallet"
        title="Deposit System"
        subtitle="Add funds securely using supported cryptocurrencies. Transparent processing with real-time status tracking."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
              <Wallet className="size-5 text-[#0052ff]" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Deposit method</h3>
              <p className="text-sm text-gray-500">Crypto only</p>
            </div>
          </div>

          <div className="space-y-3">
            {DEPOSIT_ASSETS.map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Bitcoin className="size-5 text-[#0052ff]" aria-hidden />
                  <span className="font-semibold text-gray-900">{asset.symbol}</span>
                </div>
                <span className="text-xs text-gray-500">{asset.networks.join(' · ')}</span>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
              <Clock className="size-5 text-emerald-600" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Processing</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            When you initiate a deposit, the platform generates a unique wallet address for your
            selected network. After you send crypto, the transaction enters a confirmation queue.
          </p>
          <div className="mt-5">
            <CheckList items={DEPOSIT_POINTS} />
          </div>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
