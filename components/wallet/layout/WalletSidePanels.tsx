'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Headphones, ShieldCheck } from 'lucide-react'
import { AsyncState } from '@/components/shared/data-state'
import { WalletListSkeleton } from '@/components/wallet/layout/WalletListSkeleton'
import { cn } from '@/lib/utils'
export function WalletLimitsPanel({
  dailyUsed = 1250,
  dailyMax = 25000,
  monthlyUsed = 4250,
  monthlyMax = 100000,
  rules,
}: {
  dailyUsed?: number
  dailyMax?: number
  monthlyUsed?: number
  monthlyMax?: number
  rules: { label: string; value: string }[]
}) {
  const t = useTranslations('wallet.sidePanels')

  const dailyPct = Math.min(100, Math.round((dailyUsed / dailyMax) * 100))
  const monthlyPct = Math.min(100, Math.round((monthlyUsed / monthlyMax) * 100))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{t('limits')}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('verifiedAccount')}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>{t('dailyLimit')}</span>
            <span>
              ${dailyUsed.toLocaleString()} / ${dailyMax.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#0052ff]" style={{ width: `${dailyPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>{t('monthlyLimit')}</span>
            <span>
              ${monthlyUsed.toLocaleString()} / ${monthlyMax.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#0052ff]" style={{ width: `${monthlyPct}%` }} />
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4">
        {rules.map((rule) => (
          <li key={rule.label} className="flex justify-between gap-3 text-sm">
            <span className="text-gray-500">{rule.label}</span>
            <span className="font-medium text-gray-900">{rule.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WalletRecentPanel({
  title,
  items,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = '',
  emptyDescription = '',
  emptyAction,
}: {
  title: string
  items: {
    id: string
    label: string
    sublabel?: string
    amount: string
    status: string
    statusKey?: string
    time: string
    positive?: boolean
  }[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
}) {
  const t = useTranslations('wallet.sidePanels')
  const resolvedEmptyTitle = emptyTitle || t('noActivity')
  const resolvedEmptyDescription = emptyDescription || t('noActivityDesc')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">{title}</h3>
      <AsyncState
        loading={loading}
        error={error}
        onRetry={onRetry}
        isEmpty={items.length === 0}
        emptyTitle={resolvedEmptyTitle}
        emptyDescription={resolvedEmptyDescription}
        emptyAction={emptyAction}
        errorTitle={t('loadActivityError')}
        skeleton={<WalletListSkeleton rows={4} />}
        compact
      >
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{item.label}</p>
                {item.sublabel ? (
                  <p className="truncate text-xs text-gray-500">{item.sublabel}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    'text-sm font-bold',
                    item.positive ? 'text-emerald-600' : 'text-gray-900'
                  )}
                >
                  {item.amount}
                </p>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                    (item.statusKey ?? item.status).toLowerCase() === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : (item.statusKey ?? item.status).toLowerCase() === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                  )}
                >
                  {item.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </AsyncState>
    </div>
  )
}

export function WalletDepositCta() {
  const t = useTranslations('wallet.sidePanels')

  return (
    <Link
      href="/wallet/deposit"
      className="inline-flex rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      {t('makeDeposit')}
    </Link>
  )
}

/** @deprecated Use WalletDepositCta */
export function walletDepositCta() {
  return <WalletDepositCta />
}

export function WalletTransferCta() {
  const t = useTranslations('wallet.sidePanels')

  return (
    <Link
      href="/wallet/transfer"
      className="inline-flex rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      {t('sendTransfer')}
    </Link>
  )
}

/** @deprecated Use WalletTransferCta */
export function walletTransferCta() {
  return <WalletTransferCta />
}

export function WalletHelpPanel() {
  const t = useTranslations('wallet.sidePanels')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0052ff]">
          <Headphones className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{t('needHelp')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('supportBody')}</p>
          <Link
            href="/support"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Headphones className="h-4 w-4" />
            {t('contactSupport')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function WalletSecurityNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <p className="text-sm text-amber-900">{children}</p>
    </div>
  )
}
