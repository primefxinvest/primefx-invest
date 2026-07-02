'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  ArrowRight,
  Bitcoin,
  Check,
  Zap,
  ExternalLink,
  Loader2,
  QrCode,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { KycFinancialBanner } from '@/components/compliance/KycFinancialBanner'
import { WalletPageHeader } from '@/components/wallet/layout/WalletPageHeader'
import { WalletStatCard } from '@/components/wallet/layout/WalletStatCard'
import { WalletStepIndicator } from '@/components/wallet/layout/WalletStepIndicator'
import {
  WalletDepositCta,
  WalletHelpPanel,
  WalletLimitsPanel,
  WalletRecentPanel,
} from '@/components/wallet/layout/WalletSidePanels'
import { CustomSelect } from '@/components/ui/custom-select'
import { AsyncState } from '@/components/shared/data-state'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useWalletPageData } from '@/lib/hooks/useWalletPageData'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { kycBlockReason, kycFallbackMessage } from '@/lib/investor/kyc-i18n'
import { showKycRequiredToast } from '@/lib/notifications/kyc-toast'
import type { PaymentProviderOptions } from '@/lib/payments/types'
import {
  buildDepositCurrencyOptions,
  DEFAULT_DEPOSIT_CURRENCY,
} from '@/lib/payments/currency-options'
import { initiateDeposit } from '@/lib/wallet/actions'
import { walletTxStatusLabel, walletTxTypeLabel } from '@/lib/wallet/i18n'
import { cn } from '@/lib/utils'

const DEPOSIT_METHODS = [
  {
    id: 'nowpayments',
    icon: Bitcoin,
    etaKey: 'etaCrypto',
    badgeKey: 'badgeCrypto',
    labelKey: 'methodNowPayments',
  },
  {
    id: 'binancepay',
    icon: Zap,
    etaKey: 'etaCrypto',
    badgeKey: 'badgeNoFee',
    labelKey: 'methodBinancePay',
  },
] as const

type DepositPageViewProps = {
  initialPaymentOptions: PaymentProviderOptions
}

export function DepositPageView({ initialPaymentOptions }: DepositPageViewProps) {
  const t = useTranslations('wallet.deposit')
  const tBalances = useTranslations('wallet.balances')
  const tWallet = useTranslations('wallet')
  const tCompliance = useTranslations('compliance')
  const router = useRouter()
  const kyc = useFinancialKycAccess()
  const {
    wallet,
    transactions,
    walletLoading,
    walletError,
    reloadWallet,
    transactionsLoading,
    transactionsError,
    reloadTransactions,
  } = useWalletPageData()
  const [method, setMethod] = useState<(typeof DEPOSIT_METHODS)[number]['id']>('nowpayments')
  const [amount, setAmount] = useState('500')
  const nowPaymentsEnabled = initialPaymentOptions.nowPaymentsEnabled
  const binancePayEnabled = initialPaymentOptions.binancePayEnabled
  const depositCurrencies =
    initialPaymentOptions.depositCurrencies.length > 0
      ? initialPaymentOptions.depositCurrencies
      : buildDepositCurrencyOptions().map((item) => ({
          value: item.value,
          label: item.label,
          provider: item.provider,
        }))
  const filteredCurrencies = useMemo(
    () =>
      depositCurrencies
        .filter((item) =>
          method === 'binancepay' ? item.provider === 'binance_pay' : item.provider === 'now_payments'
        )
        .map((item) => ({ value: item.value, label: item.label })),
    [depositCurrencies, method]
  )
  const [currency, setCurrency] = useState(() => {
    const firstNow = depositCurrencies.find((item) => item.provider === 'now_payments')?.value
    return firstNow ?? DEFAULT_DEPOSIT_CURRENCY
  })
  const [note, setNote] = useState('')
  const [step, setStep] = useState<'form' | 'ready'>('form')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [payAddress, setPayAddress] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const preferredProvider = method === 'binancepay' ? 'binance_pay' : 'now_payments'
    const next = depositCurrencies.find((item) => item.provider === preferredProvider)?.value
    if (next && next !== currency) {
      setCurrency(next)
    }
    // Only react to method changes / options changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, depositCurrencies])

  const recentDeposits = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === 'Deposit')
        .slice(0, 4)
        .map((tx) => ({
          id: tx.id,
          label: walletTxTypeLabel(tWallet, tx.type),
          sublabel: tx.referenceId,
          amount: tx.amount,
          status: walletTxStatusLabel(tWallet, tx.status),
          statusKey: tx.status.toLowerCase(),
          time: `${tx.date}${tx.time ? ` · ${tx.time}` : ''}`,
          positive: tx.isCredit,
        })),
    [transactions, tWallet]
  )

  const monthDeposits = useMemo(() => {
    const deposits = transactions.filter((tx) => tx.type === 'Deposit' && tx.isCredit)
    return {
      total: deposits.reduce((sum, tx) => sum + Math.abs(tx.amountValue), 0),
      count: deposits.length,
    }
  }, [transactions])

  const pendingDeposits = transactions.filter(
    (tx) => tx.type === 'Deposit' && tx.status.toLowerCase() === 'pending'
  )

  const handleDeposit = () => {
    if (!kyc.loading && !kyc.verified) {
      showKycRequiredToast({
        status: kyc.status,
        action: 'deposit',
        title: tCompliance('kycToastTitle'),
        description:
          kycBlockReason(tCompliance, kyc.status, 'deposit') ??
          kyc.summary ??
          kycFallbackMessage(tCompliance, 'deposit'),
      })
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value < 10) {
      toast.error(t('minDepositError'))
      return
    }

    if (method === 'nowpayments' && !nowPaymentsEnabled) {
      toast.error(t('nowPaymentsConfigError'), {
        description: t('nowPaymentsConfigHint'),
      })
      return
    }

    if (method === 'binancepay' && !binancePayEnabled) {
      toast.error(t('binancePayConfigError'), {
        description: t('binancePayConfigHint'),
      })
      return
    }

    startTransition(async () => {
      const result = await initiateDeposit({ amountUsd: value, currency })
      if (!result.success) {
        toast.error(t('depositFailed'), { description: result.error })
        return
      }
      setCheckoutUrl(result.checkoutUrl ?? null)
      setPayAddress(result.payAddress ?? null)
      setStep('ready')
      toast.success(t('paymentCreated'))
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <WalletPageHeader title={t('title')} description={t('description')} />

      <KycFinancialBanner />

      <AsyncState
        loading={walletLoading && !wallet}
        error={walletError}
        onRetry={reloadWallet}
        errorTitle={t('loadWalletError')}
        skeleton={<MetricCardsSkeleton count={4} />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WalletStatCard
            label={tBalances('available')}
            value={wallet?.availableBalance ?? '$0.00'}
            subtext={tBalances('usdWallet')}
            icon={Wallet}
            iconClassName="bg-blue-50 text-[#0052ff]"
          />
          <WalletStatCard
            label={t('totalDeposited')}
            value={wallet?.totalBalance ?? '$0.00'}
            subtext={tBalances('allTime')}
            icon={ArrowRight}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <WalletStatCard
            label={t('pendingDeposits')}
            value={`$${pendingDeposits.reduce((s, tx) => s + Math.abs(tx.amountValue), 0).toFixed(2)}`}
            subtext={`${pendingDeposits.length} ${pendingDeposits.length === 1 ? t('transaction') : t('transactions')}`}
            icon={Loader2}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <WalletStatCard
            label={t('monthDeposits')}
            value={`$${monthDeposits.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext={`${monthDeposits.count} ${t('transactions')}`}
            icon={Bitcoin}
            iconClassName="bg-indigo-50 text-indigo-600"
          />
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <WalletStepIndicator
              steps={[t('stepSelectMethod'), t('stepEnterDetails'), t('stepConfirm'), t('stepSuccess')]}
              current={step === 'form' ? 1 : 2}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">{t('selectMethod')}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DEPOSIT_METHODS.map((item) => {
                const Icon = item.icon
                const selected = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMethod(item.id)
                      setStep('form')
                    }}
                    className={cn(
                      'relative rounded-xl border p-4 text-left transition-all',
                      selected
                        ? 'border-[#0052ff] bg-blue-50/40 ring-2 ring-[#0052ff]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {selected ? (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#0052ff] text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                    <Icon className="h-6 w-6 text-[#0052ff]" />
                    <p className="mt-3 font-semibold text-gray-900">{t(item.labelKey)}</p>
                    <p className="mt-1 text-xs text-gray-500">{t(item.etaKey)}</p>
                    <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      {t(item.badgeKey)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">{t('depositDetails')}</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('cryptoCurrency')}</label>
                  <CustomSelect
                    value={currency}
                    onValueChange={setCurrency}
                    options={filteredCurrencies}
                    placeholder={t('selectCurrency')}
                    disabled={pending || filteredCurrencies.length === 0}
                  />
                  {method === 'nowpayments' ? (
                    !nowPaymentsEnabled ? (
                      <p className="mt-1 text-xs text-amber-700">{t('nowPaymentsNotConfigured')}</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">{t('nowPaymentsHint')}</p>
                    )
                  ) : !binancePayEnabled ? (
                    <p className="mt-1 text-xs text-amber-700">{t('binancePayNotConfigured')}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">{t('binancePayHint')}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('amount')}</label>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    disabled={pending}
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('amountLimits')}</p>
                </div>
                <div className="rounded-lg bg-blue-50 px-4 py-3">
                  <p className="text-xs text-gray-500">{t('youWillReceive')}</p>
                  <p className="text-lg font-bold text-gray-900">{Number(amount || 0).toFixed(2)} USD</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('noteOptional')}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                    placeholder={t('notePlaceholder')}
                  />
                </div>
              </div>

              {step === 'ready' && (checkoutUrl || payAddress) ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <h3 className="font-semibold text-emerald-900">{t('paymentReady')}</h3>
                  {checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0052ff]"
                    >
                      {t('openCheckout')} <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  {payAddress ? (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600">{t('sendToAddress')}</p>
                      <p className="mt-1 break-all font-mono text-sm">{payAddress}</p>
                      <QrCode className="mt-2 h-8 w-8 text-gray-400" />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  {t('selectMethodHint')}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={handleDeposit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('continue')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { titleKey: 'featureSecureTitle', textKey: 'featureSecureText' },
              { titleKey: 'featureFastTitle', textKey: 'featureFastText' },
              { titleKey: 'featureFeesTitle', textKey: 'featureFeesText' },
              { titleKey: 'featureOptionsTitle', textKey: 'featureOptionsText' },
            ].map((item) => (
              <div key={item.titleKey} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-gray-900">{t(item.titleKey)}</p>
                <p className="mt-1 text-sm text-gray-500">{t(item.textKey)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <WalletLimitsPanel
            rules={[
              { label: t('limitsMin'), value: '$10.00' },
              { label: t('limitsMax'), value: '$50,000.00' },
              { label: t('limitsFee'), value: '0%' },
              { label: t('limitsTime'), value: t('limitsTimeValue') },
            ]}
          />
          <WalletRecentPanel
            title={t('recentDeposits')}
            items={recentDeposits}
            loading={transactionsLoading && !transactions.length}
            error={transactionsError}
            onRetry={reloadTransactions}
            emptyTitle={t('noDepositsTitle')}
            emptyDescription={t('noDepositsDesc')}
            emptyAction={<WalletDepositCta />}
          />
          <WalletHelpPanel />
        </div>
      </div>
    </div>
  )
}
