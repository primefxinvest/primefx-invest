import { Mail, Send, User, Zap } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { formatDisplayFeeUsd } from '@/lib/fees/display'
import { INTERNAL_TRANSFER_FEE_USD } from '@/lib/fees/constants'
import { InfoCard, SectionHeader, SectionShell } from './shared'

const TRANSFER_METHODS = [
  { icon: Mail, label: 'Email Address', description: 'Send to any PrimeFx user by email.' },
  { icon: User, label: 'PrimeFx ID', description: 'Transfer using a unique PrimeFx identifier.' },
] as const

const FIXED_FEE_LABEL = formatDisplayFeeUsd(INTERNAL_TRANSFER_FEE_USD)

export function HowPrimefxTransferSection() {
  return (
    <SectionShell id="transfers">
      <SectionHeader
        eyebrow="Wallet"
        title="Transfer System"
        subtitle="Move funds instantly between PrimeFx accounts with a transparent fixed transfer fee."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {TRANSFER_METHODS.map((method) => {
          const Icon = method.icon
          return (
            <InfoCard key={method.label}>
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="size-5 text-[#0052ff]" aria-hidden />
              </div>
              <h3 className="font-bold text-gray-900">{method.label}</h3>
              <p className="mt-2 text-sm text-gray-600">{method.description}</p>
            </InfoCard>
          )
        })}

        <InfoCard className="bg-gradient-to-br from-emerald-50/80 via-white to-white md:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100">
                <Zap className="size-5 text-emerald-600" aria-hidden />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Instant internal transfers</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Internal transfers between PrimeFx Invest accounts are processed instantly with a
                  fixed fee of{' '}
                  <strong className="font-semibold text-emerald-600">{FIXED_FEE_LABEL}</strong>.
                </p>
              </div>
            </div>
            <Link
              href="/wallet/transfer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Send className="size-4" aria-hidden />
              Transfer Funds
            </Link>
          </div>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
