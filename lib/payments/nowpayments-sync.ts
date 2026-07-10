import 'server-only'

import {
  getNowPaymentsPaymentStatus,
  isPaymentCreditable,
  isPaymentFailed,
  listNowPaymentsPaymentsByOrderId,
  type NowPaymentsPaymentRecord,
} from './nowpayments'
import { isDepositPaymentSettled } from './nowpayments-settlement'
import {
  completeDepositFromWebhook,
  failDepositFromWebhook,
} from './service'
import { getPaymentByOrderId, updatePaymentStatus, updateTransactionSyncNote } from './wallet-ledger'

const NOWPAYMENTS_STATUS_LABELS: Record<string, string> = {
  waiting: 'Awaiting crypto payment',
  confirming: 'Confirming on blockchain',
  confirmed: 'Payment confirmed — crediting wallet',
  sending: 'Processing payment',
  partially_paid: 'Partial payment received',
  finished: 'Payment completed',
  failed: 'Payment failed',
  expired: 'Payment expired',
  refunded: 'Payment refunded',
}

function formatNowPaymentsStatusLabel(status: string) {
  const key = status.toLowerCase()
  return NOWPAYMENTS_STATUS_LABELS[key] ?? `NOWPayments: ${status}`
}

async function resolveNowPaymentsPayments(orderId: string): Promise<NowPaymentsPaymentRecord[]> {
  const listed = await listNowPaymentsPaymentsByOrderId(orderId)
  if (listed.length > 0) {
    return listed
  }

  const local = await getPaymentByOrderId(orderId)
  const providerPaymentId = local?.provider_payment_id
  if (!providerPaymentId) {
    return []
  }

  try {
    const payment = await getNowPaymentsPaymentStatus(providerPaymentId)
    return payment ? [payment] : []
  } catch {
    return []
  }
}

export type NowPaymentsSyncResult = {
  orderId: string
  providerStatus: string | null
  status: 'completed' | 'failed' | 'pending'
  message?: string
  partial?: boolean
  creditedAmountUsd?: number
}

/** Poll NOWPayments API and reconcile local deposit + transaction state. */
export async function syncNowPaymentsDepositStatus(orderId: string): Promise<NowPaymentsSyncResult> {
  const localPayment = await getPaymentByOrderId(orderId)
  if (localPayment && isDepositPaymentSettled(String(localPayment.status ?? ''))) {
    return {
      orderId,
      providerStatus: String(localPayment.status ?? 'completed'),
      status: 'completed',
      message: String(localPayment.status) === 'completed_partial' ? 'Partial deposit credited' : 'Deposit credited',
      partial: String(localPayment.status) === 'completed_partial',
    }
  }

  const payments = await resolveNowPaymentsPayments(orderId)

  if (payments.length === 0) {
    return {
      orderId,
      providerStatus: null,
      status: 'pending',
      message: 'No NOWPayments payment found yet.',
    }
  }

  const latest = payments[0]
  const paymentStatus = String(latest.payment_status ?? '').toLowerCase()

  if (isPaymentCreditable(paymentStatus)) {
    const result = await completeDepositFromWebhook(orderId, {
      webhookPayload: latest as Record<string, unknown>,
      providerStatus: paymentStatus,
    })

    if (result.credited) {
      return {
        orderId,
        providerStatus: paymentStatus,
        status: 'completed',
        partial: result.partial,
        creditedAmountUsd: result.creditedAmountUsd,
        message: result.partial ? 'Partial deposit credited' : 'Deposit credited',
      }
    }

    if (result.reason === 'below_minimum') {
      return {
        orderId,
        providerStatus: paymentStatus,
        status: 'failed',
        message: 'Deposit amount is below the minimum required.',
      }
    }

    if (result.reason === 'already_completed') {
      return {
        orderId,
        providerStatus: paymentStatus,
        status: 'completed',
        message: 'Deposit already credited',
      }
    }
  }

  if (isPaymentFailed(paymentStatus)) {
    await failDepositFromWebhook(
      orderId,
      paymentStatus === 'expired' ? 'expired' : paymentStatus === 'refunded' ? 'refunded' : 'failed'
    )
    return { orderId, providerStatus: paymentStatus, status: 'failed' }
  }

  if (['waiting', 'confirming', 'sending'].includes(paymentStatus)) {
    const mappedStatus =
      paymentStatus === 'waiting'
        ? 'pending'
        : paymentStatus === 'confirming'
          ? 'confirming'
          : 'processing'

    await updatePaymentStatus(orderId, mappedStatus, {
      provider_payment_id: latest.payment_id != null ? String(latest.payment_id) : undefined,
      pay_amount: latest.pay_amount != null ? Number(latest.pay_amount) : undefined,
      metadata: latest,
    })

    const label = formatNowPaymentsStatusLabel(paymentStatus)
    await updateTransactionSyncNote(
      orderId,
      `Deposit via NOWPayments — ${label}. Balance updates when payment is confirmed.`
    )
  }

  return {
    orderId,
    providerStatus: paymentStatus || null,
    status: 'pending',
    message: formatNowPaymentsStatusLabel(paymentStatus || 'unknown'),
  }
}
