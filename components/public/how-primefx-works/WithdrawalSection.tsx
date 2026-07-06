import { ArrowUpRight, Clock, Shield } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { WITHDRAWAL_NETWORKS } from '@/lib/how-primefx-works/content'
import { CheckList, InfoCard, SectionHeader, SectionShell } from './shared'

const WITHDRAWAL_POINTS = [
  'Withdraw profits or principal from your wallet.',
  'Select a supported network and enter your destination address.',
  'Platform fee applies — no hidden charges.',
  'Blockchain confirmations may affect final delivery time.',
  'Typical processing within 24 hours after approval.',
] as const

export function HowPrimefxWithdrawalSection() {
  return (
    <SectionShell id="withdrawals" variant="muted">
      <SectionHeader
        eyebrow="Wallet"
        title="Withdrawal System"
        subtitle="Withdraw profits or principal to your preferred crypto network. Transparent fees and clear processing timelines."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <InfoCard className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900">How withdrawals work</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Submit a withdrawal request from your wallet dashboard. Choose your network, enter the
            destination address, and confirm. Our team reviews requests for security compliance
            before processing.
          </p>
          <div className="mt-5">
            <CheckList items={WITHDRAWAL_POINTS} />
          </div>
          <Link
            href="/wallet/withdraw"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
          >
            Go to Withdrawals
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </InfoCard>

        <InfoCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
              <Shield className="size-5 text-[#0052ff]" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Supported networks</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {WITHDRAWAL_NETWORKS.map((network) => (
              <span
                key={network}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
              >
                {network}
              </span>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Withdrawal fee: platform fee only. Network gas fees may apply on-chain.
            </span>
          </div>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
