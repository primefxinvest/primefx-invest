'use client'

import { useEffect, useState, useTransition } from 'react'
import { ExternalLink, Loader2, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'
import { getPaymentProviderOptions, initiateDeposit } from '@/lib/payments/actions'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { getKycBlockReason } from '@/lib/investor/kyc'

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DepositStep = 'form' | 'ready'

function openPaymentTab(url: string) {
  const tab = window.open(url, '_blank', 'noopener,noreferrer')
  if (!tab) {
    toast.error('Could not open payment page', {
      description: 'Allow pop-ups for this site, or use the link below.',
    })
    return false
  }
  tab.focus()
  return true
}

export default function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const kyc = useFinancialKycAccess()
  const [amount, setAmount] = useState('100')
  const [currency, setCurrency] = useState('USDT')
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([])
  const [step, setStep] = useState<DepositStep>('form')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [checkoutProvider, setCheckoutProvider] = useState<'binance_pay' | 'now_payments' | null>(
    null
  )
  const [payAddress, setPayAddress] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState<number | null>(null)
  const [payCurrency, setPayCurrency] = useState<string | null>(null)
  const [qrCodeLink, setQrCodeLink] = useState<string | null>(null)
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return

    getPaymentProviderOptions().then((options) => {
      setCurrencies(options.depositCurrencies.map((item) => ({ value: item.value, label: item.label })))
      if (options.depositCurrencies[0]) {
        setCurrency(options.depositCurrencies[0].value)
      }
    })
  }, [open])

  const resetState = () => {
    setStep('form')
    setCheckoutUrl(null)
    setCheckoutProvider(null)
    setPayAddress(null)
    setPayAmount(null)
    setPayCurrency(null)
    setQrCodeLink(null)
    setPaymentOpened(false)
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  const handleCreatePayment = () => {
    if (!kyc.loading && !kyc.verified) {
      toast.error('KYC verification required', {
        description:
          getKycBlockReason(kyc.status, 'deposit') ??
          kyc.summary ??
          'Complete KYC before making a deposit.',
      })
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid deposit amount.')
      return
    }

    startTransition(async () => {
      const result = await initiateDeposit({ amountUsd: value, currency })

      if (!result.success) {
        toast.error('Deposit failed', { description: result.error })
        return
      }

      const url = result.checkoutUrl ?? null
      setCheckoutUrl(url)
      setCheckoutProvider(result.provider ?? null)
      setQrCodeLink(result.qrCodeLink ?? null)
      setPayAddress(result.payAddress ?? null)
      setPayAmount(result.payAmount ?? null)
      setPayCurrency(result.payCurrency ?? null)

      if (url) {
        setStep('ready')
        toast.success('Payment created', {
          description: 'Confirm below to open the checkout page in a new tab.',
        })
        return
      }

      if (result.payAddress) {
        setStep('ready')
        toast.success('Deposit address ready', {
          description: 'Send crypto to the address shown below.',
        })
        return
      }

      toast.success('Deposit initiated')
    })
  }

  const handleConfirmAndOpen = () => {
    if (!checkoutUrl) return
    const opened = openPaymentTab(checkoutUrl)
    if (opened) {
      setPaymentOpened(true)
      toast.success('Payment page opened', {
        description: 'Complete payment in the new tab. You can return here when finished.',
      })
    }
  }

  const providerLabel =
    checkoutProvider === 'binance_pay' ? 'Binance Pay' : 'NOWPayments'

  const openButtonLabel =
    checkoutProvider === 'binance_pay' ? 'Open Binance Pay checkout' : 'Open payment checkout'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deposit Funds</h2>
            <p className="mt-1 text-sm text-gray-500">
              {step === 'form'
                ? 'Pay with Binance Pay or crypto via NOWPayments.'
                : 'Your payment session is ready.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {step === 'form' ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Amount (USD)</label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0052ff] focus:outline-none"
                  disabled={pending}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Currency</label>
                <CustomSelect
                  value={currency}
                  onValueChange={setCurrency}
                  options={currencies}
                  placeholder="Select currency"
                  disabled={pending || currencies.length === 0}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  BNB/BUSD use Binance Pay. Other options open a USD invoice — you pick the exact coin
                  on the NOWPayments page.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreatePayment}
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0052ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating payment...
                  </>
                ) : (
                  'Continue to payment'
                )}
              </button>
            </>
          ) : (
            <>
              {checkoutUrl ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">
                    {checkoutProvider === 'binance_pay'
                      ? 'Binance Pay checkout ready'
                      : 'Crypto payment invoice ready'}
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    {paymentOpened
                      ? `Complete payment in the ${providerLabel} tab. If it did not open, use the button below.`
                      : checkoutProvider === 'binance_pay'
                        ? 'Click confirm to open Binance Pay in a new tab.'
                        : 'Click confirm to open NOWPayments in a new tab. Amount is charged in USD.'}
                  </p>
                  {qrCodeLink ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-blue-800">
                      <QrCode className="h-4 w-4" />
                      QR payment link is available on the checkout page
                    </div>
                  ) : null}
                </div>
              ) : null}

              {payAddress ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Send crypto to this address</p>
                  <p className="mt-2 break-all font-mono text-xs">{payAddress}</p>
                  {payAmount != null && payCurrency ? (
                    <p className="mt-2 text-xs">
                      Amount: <span className="font-semibold">{payAmount}</span>{' '}
                      {payCurrency.toUpperCase()}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {checkoutUrl ? (
                <button
                  type="button"
                  onClick={handleConfirmAndOpen}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0052ff] py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  {paymentOpened ? `Open ${providerLabel} again` : `Confirm & ${openButtonLabel}`}
                </button>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetState}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  New deposit
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
