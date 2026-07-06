'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  Loader2,
  QrCode,
  Shield,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CryptoAssetIcon, NetworkBadge } from '@/components/wallet/withdraw/CryptoAssetIcon'
import { WithdrawReviewDialog } from '@/components/wallet/withdraw/WithdrawReviewDialog'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import {
  calculateDisplayWithdrawalReceive,
  formatDisplayFeeUsd,
  getDisplayNetworkFeeUsd,
} from '@/lib/fees/display'
import {
  getNetworksForAsset,
  validateWithdrawAddress,
  WITHDRAW_ASSETS,
  type WithdrawAssetId,
  type WithdrawNetworkOption,
} from '@/lib/payments/withdraw-networks'
import { cn } from '@/lib/utils'

type WithdrawFormCardProps = {
  amount: string
  onAmountChange: (value: string) => void
  assetId: WithdrawAssetId
  onAssetChange: (value: WithdrawAssetId) => void
  networkId: string
  onNetworkChange: (value: string) => void
  availableApiCurrencies: string[]
  address: string
  onAddressChange: (value: string) => void
  available: number
  onSubmit: () => void
  isProcessing?: boolean
  kycLoading?: boolean
  withdrawDisabled?: boolean
  cryptoWithdrawalsEnabled?: boolean
}

function FormSection({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-b border-border pb-5 last:border-0 last:pb-0">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0052ff] text-sm font-bold text-white">
          {step}
        </span>
        <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
      </div>
      {children}
    </section>
  )
}

export function WithdrawFormCard({
  amount,
  onAmountChange,
  assetId,
  onAssetChange,
  networkId,
  onNetworkChange,
  availableApiCurrencies,
  address,
  onAddressChange,
  available,
  onSubmit,
  isProcessing = false,
  kycLoading = false,
  withdrawDisabled = false,
  cryptoWithdrawalsEnabled = true,
}: WithdrawFormCardProps) {
  const t = useTranslations('wallet.withdraw')
  const tDeposit = useTranslations('wallet.deposit')

  const [reviewOpen, setReviewOpen] = useState(false)
  const [addressTouched, setAddressTouched] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const amountNum = Number(amount) || 0
  const minWithdrawal = INVESTOR_RULES.financial.minimumWithdrawal
  const isLocked = isProcessing || kycLoading

  const networks = useMemo(
    () => getNetworksForAsset(assetId, availableApiCurrencies),
    [assetId, availableApiCurrencies]
  )

  const selectedNetwork: WithdrawNetworkOption | null =
    networks.find((n) => n.id === networkId) ?? networks[0] ?? null

  useEffect(() => {
    if (!networks.length) return
    if (!networks.some((n) => n.id === networkId)) {
      onNetworkChange(networks[0].id)
    }
  }, [networks, networkId, onNetworkChange])

  const addressValidation = validateWithdrawAddress(address, selectedNetwork)
  const displayFees = calculateDisplayWithdrawalReceive(amountNum, networkId)
  const youWillReceive = displayFees.youWillReceiveUsd

  const amountError =
    amountNum > 0 && amountNum < minWithdrawal
      ? t('minWithdrawalError', { amount: `$${minWithdrawal.toFixed(2)}` })
      : amountNum > available
        ? t('exceedsBalance')
        : null

  const canReview =
    !withdrawDisabled &&
    cryptoWithdrawalsEnabled &&
    amountNum >= minWithdrawal &&
    amountNum <= available &&
    addressValidation.valid &&
    selectedNetwork !== null

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onAddressChange(text.trim())
        setAddressTouched(true)
      }
    } catch {
      /* clipboard denied */
    }
  }

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canReview || isLocked) return
    setReviewOpen(true)
  }

  const handleConfirm = () => {
    setReviewOpen(false)
    setSubmitSuccess(true)
    onSubmit()
    setTimeout(() => setSubmitSuccess(false), 2000)
  }

  const buttonLabel = kycLoading
    ? tDeposit('kycCheckingButton')
    : isProcessing
      ? t('processing')
      : submitSuccess
        ? t('submittedShort')
        : t('continueToReview')

  const selectedAsset = WITHDRAW_ASSETS.find((a) => a.id === assetId)

  return (
    <>
      <div className={cn(dashboardCardClass, 'shadow-sm')}>
        <div className="mb-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{t('formTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('formSubtitle')}</p>
        </div>

        {!cryptoWithdrawalsEnabled ? (
          <p
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            role="status"
          >
            {t('cryptoUnavailable')}
          </p>
        ) : null}

        <form onSubmit={handleReview} className="space-y-5">
          {/* Step 1: Asset */}
          <FormSection step={1} title={t('stepSelectCrypto')}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {WITHDRAW_ASSETS.map((asset) => {
                const assetNetworks = getNetworksForAsset(asset.id, availableApiCurrencies)
                const disabled = assetNetworks.length === 0 || isLocked
                const selected = assetId === asset.id

                return (
                  <button
                    key={asset.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAssetChange(asset.id)}
                    className={cn(
                      'flex min-h-[44px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all',
                      selected
                        ? 'border-[#0052ff] bg-[#0052ff]/5 ring-2 ring-[#0052ff]/15'
                        : 'border-border bg-card hover:border-[#0052ff]/30',
                      disabled && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    <CryptoAssetIcon assetId={asset.id} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{asset.symbol}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{asset.name}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </FormSection>

          {/* Step 2: Network */}
          <FormSection step={2} title={t('stepSelectNetwork')}>
            {networks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noNetworksAvailable')}</p>
            ) : (
              <div className="space-y-2">
                {networks.map((network) => {
                  const selected = networkId === network.id
                  return (
                    <button
                      key={network.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => onNetworkChange(network.id)}
                      className={cn(
                        'flex w-full min-h-[44px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                        selected
                          ? 'border-[#0052ff] bg-[#0052ff]/5 ring-2 ring-[#0052ff]/15'
                          : 'border-border bg-card hover:border-[#0052ff]/30',
                        isLocked && 'opacity-60'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CryptoAssetIcon assetId={assetId} size="sm" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{network.label}</span>
                            <NetworkBadge label={network.badge} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('estimatedNetworkFee')}:{' '}
                            {formatDisplayFeeUsd(getDisplayNetworkFeeUsd(network.id))}
                          </p>
                        </div>
                      </div>
                      {selected ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0052ff]" aria-hidden />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </FormSection>

          {/* Step 3: Address */}
          <FormSection step={3} title={t('stepWalletAddress')}>
            <div className="relative">
              <input
                id="withdraw-address"
                type="text"
                value={address}
                onChange={(e) => {
                  onAddressChange(e.target.value)
                  setAddressTouched(true)
                }}
                onBlur={() => setAddressTouched(true)}
                placeholder={t('addressPlaceholder')}
                readOnly={isLocked}
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  'w-full rounded-xl border bg-background py-3 pl-4 pr-24 font-mono text-sm text-foreground',
                  'focus:border-[#0052ff] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20',
                  addressTouched && !addressValidation.valid && address.trim()
                    ? 'border-red-300'
                    : addressValidation.valid
                      ? 'border-emerald-400'
                      : 'border-border',
                  isLocked && 'opacity-60'
                )}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={isLocked}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('pasteAddress')}
                >
                  <ClipboardPaste className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg p-2 text-muted-foreground/40"
                  aria-label={t('scanQr')}
                  title={t('scanQrSoon')}
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
            </div>

            {addressTouched && address.trim() ? (
              addressValidation.valid ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {t('addressValid')}
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                  {t('addressInvalid')}
                </p>
              )
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">{t('addressHint')}</p>
            )}
          </FormSection>

          {/* Step 4: Amount */}
          <FormSection step={4} title={t('stepAmount')}>
            <div>
              <label htmlFor="withdraw-amount" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('amountUsd')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  $
                </span>
                <input
                  id="withdraw-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value.replace(/[^\d.]/g, ''))}
                  readOnly={isLocked}
                  className={cn(
                    'w-full rounded-xl border border-border bg-background py-3 pl-7 pr-16 text-lg font-bold tabular-nums text-foreground',
                    'focus:border-[#0052ff] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20',
                    amountError && 'border-red-300',
                    isLocked && 'opacity-60'
                  )}
                />
                <button
                  type="button"
                  onClick={() => onAmountChange(available.toFixed(2))}
                  disabled={isLocked || available <= 0}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#0052ff]/10 px-2.5 py-1 text-xs font-bold text-[#0052ff] hover:bg-[#0052ff]/15 disabled:opacity-40"
                >
                  {t('max')}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t('amountHelper', {
                  min: `$${minWithdrawal.toFixed(2)}`,
                  available: `$${available.toFixed(2)}`,
                })}
              </p>
              {amountError ? (
                <p className="mt-1 text-xs font-medium text-red-600">{amountError}</p>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">{t('estimatedReceive')}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-[#0052ff]">
                ${youWillReceive.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('feeBreakdown', {
                  platform: formatDisplayFeeUsd(displayFees.platformFeeUsd),
                  network: formatDisplayFeeUsd(displayFees.networkFeeUsd),
                })}
              </p>
            </div>
          </FormSection>

          {/* Notice */}
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#0052ff]" aria-hidden />
            <p className="text-sm leading-relaxed text-foreground">{t('importantNotice')}</p>
          </div>

          {/* Desktop submit */}
          <button
            type="submit"
            disabled={!canReview || isLocked}
            aria-busy={isLocked}
            className={cn(
              'hidden min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 text-sm font-semibold text-white shadow-lg shadow-[#0052ff]/20 transition-all sm:flex',
              'hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50',
              submitSuccess && 'bg-emerald-600 shadow-emerald-600/20'
            )}
          >
            {isLocked ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {buttonLabel}
              </>
            ) : (
              <>
                {buttonLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            if (canReview && !isLocked) setReviewOpen(true)
          }}
          disabled={!canReview || isLocked}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isLocked ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonLabel}
          {!isLocked ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </div>

      <WithdrawReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleConfirm}
        isProcessing={isProcessing}
        assetId={assetId}
        assetName={selectedAsset?.name ?? assetId}
        networkLabel={selectedNetwork?.label ?? ''}
        networkBadge={selectedNetwork?.badge ?? ''}
        address={address.trim()}
        amountUsd={`$${amountNum.toFixed(2)}`}
        networkFee={formatDisplayFeeUsd(displayFees.networkFeeUsd)}
        platformFee={formatDisplayFeeUsd(displayFees.platformFeeUsd)}
        youWillReceive={formatDisplayFeeUsd(displayFees.youWillReceiveUsd)}
        processingTime={t('processingTimeRange')}
      />
    </>
  )
}
