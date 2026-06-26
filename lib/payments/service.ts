import 'server-only'

import { createBinancePayOrder } from './binance-pay'
import { generatePaymentReference } from './reference'
import { resolveDepositProvider, PAYMENT_PROVIDERS } from './config'
import { isProviderConfigured } from './env'
import { createNowPaymentsInvoice, createNowPaymentsPayout } from './nowpayments'
import type { CreateDepositResult, CreateWithdrawalResult } from './types'
import {
  providerUnavailableUserMessage,
  toUserDepositError,
  toUserWithdrawalError,
} from './user-errors'
import {
  assertSufficientBalance,
  completeTransaction,
  creditInvestorWallet,
  getPaymentByOrderId,
  recordDepositPayment,
  recordWithdrawalPayment,
  updatePaymentStatus,
} from './wallet-ledger'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'

export async function createDepositPayment(input: {
  userId: string
  amountUsd: number
  currency: string
  customerEmail?: string
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

  const provider = resolveDepositProvider(input.currency)
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
    await assertSufficientBalance(input.userId, amount)

    const payout = await createNowPaymentsPayout({
      address: input.address,
      currency: input.currency,
      amount,
      extraId: orderId,
    })

    const { paymentId } = await recordWithdrawalPayment({
      userId: input.userId,
      orderId,
      amount,
      currency: input.currency,
      address: input.address,
      providerPaymentId: String(payout.id),
      metadata: { payoutId: payout.id },
    })

    return { success: true, paymentId, orderId }
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

  await creditInvestorWallet(payment.investor_id, Number(payment.amount_usd))
  await completeTransaction(orderId, 'Completed')
  await updatePaymentStatus(orderId, 'completed')
}

export async function failDepositFromWebhook(
  orderId: string,
  status: 'failed' | 'expired' | 'cancelled' | 'refunded'
) {
  await updatePaymentStatus(orderId, status)
  await completeTransaction(orderId, status === 'cancelled' ? 'Cancelled' : 'Failed')
}

export async function completeWithdrawalFromWebhook(orderId: string) {
  await updatePaymentStatus(orderId, 'completed')
  await completeTransaction(orderId, 'Completed')
}
