import 'server-only'

import { createBinancePayOrder } from './binance-pay'
import { generatePaymentReference } from './reference'
import { resolveDepositProvider, PAYMENT_PROVIDERS } from './config'
import { isCurrencySupportedByProvider } from './currency-options'
import { isProviderConfigured } from './env'
import { createNowPaymentsInvoice } from './nowpayments'
import type { CreateDepositResult, CreateWithdrawalResult } from './types'
import {
  providerUnavailableUserMessage,
  toUserDepositError,
  toUserWithdrawalError,
} from './user-errors'
import {
  completeTransaction,
  creditInvestorWallet,
  getPaymentByOrderId,
  recordDepositPayment,
  reverseFailedWithdrawalPayout,
  updatePaymentStatus,
} from './wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import {
  notifyDepositCreated,
  notifyDepositCompleted,
  notifyDepositFailed,
  notifyWithdrawalSubmitted,
  notifyWithdrawalCompleted,
} from '@/lib/notifications/service'
import { markReferralActiveOnFirstActivity } from '@/lib/referral/commission-service'

export async function createDepositPayment(input: {
  userId: string
  amountUsd: number
  currency: string
  customerEmail?: string
  provider?: PaymentProviderId
}): Promise<CreateDepositResult> {
  const kyc = await requireVerifiedKyc(input.userId, 'deposit')
  if (!kyc.allowed) {
    return { success: false, error: kyc.error }
  }

  const amount = input.amountUsd
  if (amount < INVESTOR_RULES.financial.minimumDeposit) {
    return { success: false, error: `Minimum deposit is $${INVESTOR_RULES.financial.minimumDeposit}.` }
  }
  if (amount > INVESTOR_RULES.financial.maximumSingleDeposit) {
    return {
      success: false,
      error: `Maximum single deposit is $${INVESTOR_RULES.financial.maximumSingleDeposit.toLocaleString()}.`,
    }
  }

  const provider = resolveDepositProvider(input.currency, input.provider)

  if (!isCurrencySupportedByProvider(input.currency, provider)) {
    const hint =
      provider === 'binance_pay'
        ? 'Choose a Binance Pay currency such as BNB, USDT, or BUSD.'
        : 'Choose a NOWPayments currency such as USDT (TRC20) or BTC.'
    return {
      success: false,
      error: `This currency is not available for the selected payment method. ${hint}`,
    }
  }

  if (!isProviderConfigured(provider)) {
    const error =
      provider === 'binance_pay'
        ? providerUnavailableUserMessage('binance_pay')
        : providerUnavailableUserMessage('now_payments')

    return { success: false, error }
  }

  const orderId = generatePaymentReference('deposit')

  try {
    if (provider === 'binance_pay') {
      const order = await createBinancePayOrder({
        merchantOrderId: orderId,
        orderAmount: amount,
        currency: input.currency,
        description: 'PrimeFx Investment Deposit',
      })

      const { paymentId } = await recordDepositPayment({
        userId: input.userId,
        provider,
        orderId,
        amount,
        currency: input.currency,
        providerPaymentId: order.prepayId,
        metadata: {
          currency: input.currency,
          prepayId: order.prepayId,
          checkoutUrl: order.checkoutUrl,
          qrcodeLink: order.qrcodeLink,
        },
      })

      await notifyDepositCreated(input.userId, amount, orderId)

      return {
        success: true,
        paymentId,
        orderId,
        provider,
        checkoutUrl: order.checkoutUrl ?? order.universalUrl,
        qrCodeLink: order.qrcodeLink,
        payCurrency: input.currency.toUpperCase(),
      }
    }

    const invoice = await createNowPaymentsInvoice({
      orderId,
      amount,
      currency: 'USD',
      description: 'PrimeFx Investment Deposit',
      buyerEmail: input.customerEmail,
    })

    const { paymentId } = await recordDepositPayment({
      userId: input.userId,
      provider,
      orderId,
      amount,
      currency: input.currency,
      providerPaymentId: invoice.paymentId ? String(invoice.paymentId) : invoice.invoiceId,
      metadata: {
        currency: input.currency,
        invoiceId: invoice.invoiceId,
        invoiceUrl: invoice.invoiceUrl,
        paymentId: invoice.paymentId,
        flow: 'invoice',
      },
    })

    await notifyDepositCreated(input.userId, amount, orderId)

    return {
      success: true,
      paymentId,
      orderId,
      provider,
      checkoutUrl: invoice.invoiceUrl,
      payCurrency: input.currency.toUpperCase(),
    }
  } catch (err) {
    return {
      success: false,
      error: toUserDepositError(err, provider),
    }
  }
}

export async function createWithdrawalPayment(input: {
  userId: string
  amountUsd: number
  currency: string
  address: string
}): Promise<CreateWithdrawalResult> {
  const kyc = await requireVerifiedKyc(input.userId, 'withdrawal')
  if (!kyc.allowed) {
    return { success: false, error: kyc.error }
  }

  const amount = input.amountUsd
  if (amount < INVESTOR_RULES.financial.minimumWithdrawal) {
    return { success: false, error: `Minimum withdrawal is $${INVESTOR_RULES.financial.minimumWithdrawal}.` }
  }
  if (amount > PAYMENT_PROVIDERS.now_payments.withdrawalMaxUsd) {
    return {
      success: false,
      error: `Maximum withdrawal is $${PAYMENT_PROVIDERS.now_payments.withdrawalMaxUsd.toLocaleString()}.`,
    }
  }

  if (!isProviderConfigured('now_payments')) {
    return { success: false, error: providerUnavailableUserMessage('now_payments') }
  }

  const orderId = generatePaymentReference('withdrawal')

  try {
    const { createWithdrawalRequest } = await import('@/lib/wallet/withdrawals')
    const queued = await createWithdrawalRequest({
      userId: input.userId,
      amountUsd: amount,
      methodLabel: `Crypto (${input.currency.toUpperCase()})`,
      provider: 'now_payments',
      currency: input.currency,
      payoutAddress: input.address,
      metadata: { address: input.address, currency: input.currency },
    })

    await notifyWithdrawalSubmitted(input.userId, amount, queued.referenceId)

    return {
      success: true,
      paymentId: queued.requestId,
      orderId: queued.referenceId,
      availableAt: queued.availableAt,
      noticeDays: WITHDRAWAL_NOTICE_DAYS,
    }
  } catch (err) {
    return {
      success: false,
      error: toUserWithdrawalError(err),
    }
  }
}

export async function completeDepositFromWebhook(orderId: string) {
  const payment = await getPaymentByOrderId(orderId)
  if (!payment || payment.status === 'completed') return

  const amount = Number(payment.amount_usd)
  const userId = String(payment.investor_id)

  await creditInvestorWallet(userId, amount)
  await completeTransaction(orderId, 'Completed')
  await updatePaymentStatus(orderId, 'completed')
  await notifyDepositCompleted(userId, amount, orderId)

  await markReferralActiveOnFirstActivity(userId)
}

export async function failWithdrawalFromWebhook(
  orderId: string,
  status: 'failed' | 'cancelled' | 'rejected'
) {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal operations.')
  }

  const { data: request } = await db
    .from('withdrawal_requests')
    .select('user_id, amount_usd, status')
    .eq('reference_id', orderId)
    .maybeSingle()

  const normalizedStatus = status === 'cancelled' ? 'cancelled' : 'failed'
  const txStatus = status === 'cancelled' ? 'Cancelled' : 'Failed'

  if (request) {
    const userId = String(request.user_id)
    const amount = Number(request.amount_usd)
    await reverseFailedWithdrawalPayout({ userId, amount, referenceId: orderId })
  } else {
    const payment = await getPaymentByOrderId(orderId)
    if (payment) {
      await reverseFailedWithdrawalPayout({
        userId: String(payment.investor_id),
        amount: Number(payment.amount_usd),
        referenceId: orderId,
      })
    }
  }

  await completeTransaction(orderId, txStatus)
}

export async function failDepositFromWebhook(
  orderId: string,
  status: 'failed' | 'expired' | 'cancelled' | 'refunded'
) {
  const payment = await getPaymentByOrderId(orderId)
  await updatePaymentStatus(orderId, status)
  await completeTransaction(orderId, status === 'cancelled' ? 'Cancelled' : 'Failed')

  if (payment) {
    await notifyDepositFailed(String(payment.investor_id), Number(payment.amount_usd), orderId)
  }
}

export async function completeWithdrawalFromWebhook(orderId: string) {
  const payment = await getPaymentByOrderId(orderId)
  await updatePaymentStatus(orderId, 'completed')
  await completeTransaction(orderId, 'Completed')

  if (payment) {
    await notifyWithdrawalCompleted(String(payment.investor_id), Number(payment.amount_usd), orderId)
  }
}
