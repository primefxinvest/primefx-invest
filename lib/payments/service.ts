import 'server-only'

import { createBinancePayOrder } from './binance-pay'
import { generatePaymentReference } from './reference'
import { resolveDepositProvider, PAYMENT_PROVIDERS } from './config'
import { isCurrencySupportedByProvider } from './currency-options'
import { isProviderConfigured } from './env'
import { createNowPaymentsInvoice, toNowPaymentsPayCurrency } from './nowpayments'
import { assertDepositMeetsNowPaymentsMinimum } from './deposit-limits'
import { getCancelRedirectUrl, getSuccessRedirectUrl } from './env'
import type { CreateDepositResult, CreateWithdrawalResult, PaymentProviderId } from './types'
import {
  providerUnavailableUserMessage,
  toUserDepositError,
  toUserWithdrawalError,
} from './user-errors'
import {
  claimDepositCredit,
  completeTransaction,
  creditInvestorWallet,
  finalizeDepositTransaction,
  getPaymentByOrderId,
  recordDepositPayment,
  reverseFailedWithdrawalPayout,
  updatePaymentStatus,
} from './wallet-ledger'
import {
  buildDepositSettlementMetadata,
  isDepositPaymentSettled,
  resolveDepositPaymentStatus,
  resolveDepositSettlement,
  resolveDepositTransactionStatus,
} from './nowpayments-settlement'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'
import { requireVerifiedKyc } from '@/lib/investor/kyc-server'
import {
  notifyDepositCreated,
  notifyDepositCompleted,
  notifyDepositFailed,
  notifyDepositPartialCompleted,
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

    const minimumCheck = await assertDepositMeetsNowPaymentsMinimum(input.currency, amount)
    if (!minimumCheck.ok) {
      return { success: false, error: minimumCheck.error }
    }

    const invoice = await createNowPaymentsInvoice({
      orderId,
      amount,
      currency: 'USD',
      payCurrency: input.currency,
      description: 'PrimeFx Investment Deposit',
      buyerEmail: input.customerEmail,
      successUrl: getSuccessRedirectUrl(orderId),
      cancelUrl: getCancelRedirectUrl(orderId),
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
        payCurrency: toNowPaymentsPayCurrency(input.currency),
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

export async function completeDepositFromWebhook(
  orderId: string,
  input?: {
    webhookPayload?: Record<string, unknown>
    providerStatus?: string
  }
) {
  const existing = await getPaymentByOrderId(orderId)
  if (existing && isDepositPaymentSettled(String(existing.status ?? ''))) {
    await logFinancialAudit({
      eventType: 'deposit.duplicate_blocked',
      referenceId: orderId,
    })
    return { credited: false as const, reason: 'already_completed' as const }
  }

  const requestedUsd = Number(existing?.amount_usd ?? 0)
  const payload = input?.webhookPayload ?? {}
  const providerStatus = String(
    input?.providerStatus ?? payload.payment_status ?? 'finished'
  ).toLowerCase()

  const settlement = resolveDepositSettlement(payload, requestedUsd, providerStatus)
  const receivedUsd = settlement.receivedAmountUsd

  if (receivedUsd < INVESTOR_RULES.financial.minimumDeposit) {
    await updatePaymentStatus(orderId, 'failed', {
      metadata: {
        ...(((existing?.metadata as Record<string, unknown>) ?? {})),
        ...buildDepositSettlementMetadata(settlement, payload),
        rejection_reason: 'below_minimum_deposit',
        rejection_message: 'Deposit amount is below the minimum required.',
      },
    })
    await completeTransaction(orderId, 'Failed')

    if (existing) {
      await notifyDepositFailed(String(existing.investor_id), requestedUsd, orderId)
    }

    await logFinancialAudit({
      eventType: 'deposit.rejected_below_minimum',
      referenceId: orderId,
      amountUsd: receivedUsd,
      metadata: { requestedUsd, providerStatus },
    })

    return { credited: false as const, reason: 'below_minimum' as const }
  }

  const paymentStatus = resolveDepositPaymentStatus(settlement)
  const transactionStatus = resolveDepositTransactionStatus(settlement)
  const settlementMetadata = buildDepositSettlementMetadata(settlement, payload)

  const claimed = await claimDepositCredit({
    orderId,
    paymentStatus,
    creditedUsd: receivedUsd,
    metadata: settlementMetadata,
  })

  if (!claimed) {
    await logFinancialAudit({
      eventType: 'deposit.duplicate_blocked',
      referenceId: orderId,
    })
    return { credited: false as const, reason: 'already_completed' as const }
  }

  const userId = String(claimed.investor_id)

  await creditInvestorWallet(userId, receivedUsd)

  const description = settlement.isPartial
    ? `Partial deposit via NOWPayments — $${receivedUsd.toFixed(2)} credited of $${requestedUsd.toFixed(2)} requested`
    : `Deposit via NOWPayments — $${receivedUsd.toFixed(2)} credited`

  await finalizeDepositTransaction({
    referenceId: orderId,
    amountUsd: receivedUsd,
    status: transactionStatus,
    description,
  })

  if (settlement.isPartial) {
    await notifyDepositPartialCompleted(userId, receivedUsd, requestedUsd, orderId)
  } else {
    await notifyDepositCompleted(userId, receivedUsd, orderId)
  }

  await markReferralActiveOnFirstActivity(userId)

  await logFinancialAudit({
    eventType: settlement.isPartial ? 'deposit.credited_partial' : 'deposit.credited',
    userId,
    referenceId: orderId,
    amountUsd: receivedUsd,
    metadata: {
      provider: claimed.provider,
      requestedUsd,
      receivedUsd,
      providerStatus,
      paymentStatus,
    },
  })

  return {
    credited: true as const,
    partial: settlement.isPartial,
    creditedAmountUsd: receivedUsd,
    requestedAmountUsd: requestedUsd,
  }
}

/** Legacy full-amount completion for providers without settlement payloads (e.g. Binance Pay). */
export async function completeDepositFromWebhookLegacy(orderId: string) {
  const existing = await getPaymentByOrderId(orderId)
  if (existing && isDepositPaymentSettled(String(existing.status ?? ''))) {
    await logFinancialAudit({
      eventType: 'deposit.duplicate_blocked',
      referenceId: orderId,
    })
    return { credited: false as const, reason: 'already_completed' as const }
  }

  const requestedUsd = Number(existing?.amount_usd ?? 0)
  return completeDepositFromWebhook(orderId, {
    providerStatus: 'finished',
    webhookPayload: {
      payment_status: 'finished',
      price_amount: requestedUsd,
      price_currency: 'usd',
      outcome_amount: requestedUsd,
      outcome_currency: 'usd',
    },
  })
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

export async function completeWithdrawalFromWebhook(orderId: string, webhookPayload?: Record<string, unknown>) {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal operations.')
  }

  const payment = await getPaymentByOrderId(orderId)

  if (payment && payment.status === 'completed') {
    return { completed: false, reason: 'already_completed' as const }
  }

  const { extractTransactionHash } = await import('@/lib/wallet/withdrawal-blockchain')
  const txHash = extractTransactionHash(webhookPayload ?? {}, (payment?.metadata as Record<string, unknown>) ?? {})

  if (payment) {
    await updatePaymentStatus(orderId, 'completed', {
      metadata: {
        ...((payment.metadata as Record<string, unknown>) ?? {}),
        ...(txHash ? { tx_hash: txHash, transaction_hash: txHash } : {}),
        ...(webhookPayload ?? {}),
      },
    })
  }

  await completeTransaction(orderId, 'Completed')

  const { data: request } = await db
    .from('withdrawal_requests')
    .select('id, user_id, amount_usd, status, metadata')
    .eq('reference_id', orderId)
    .maybeSingle()

  if (request && String(request.status) !== 'completed') {
    const requestMetadata = (request.metadata as Record<string, unknown> | null) ?? {}
    await db
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        metadata: txHash
          ? { ...requestMetadata, tx_hash: txHash, transaction_hash: txHash }
          : requestMetadata,
      })
      .eq('id', request.id)
      .in('status', ['processing', 'approved'])

    await logFinancialAudit({
      eventType: 'withdrawal.completed',
      userId: String(request.user_id),
      referenceId: orderId,
      amountUsd: Number(request.amount_usd),
      metadata: { source: 'payout_webhook' },
    })

    if (payment) {
      await notifyWithdrawalCompleted(
        String(request.user_id),
        Number(request.amount_usd),
        orderId
      )
    }
  } else if (payment) {
    await notifyWithdrawalCompleted(String(payment.investor_id), Number(payment.amount_usd), orderId)
  }

  return { completed: true as const }
}
