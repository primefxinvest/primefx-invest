import 'server-only'

import {
  getNowPaymentsPaymentStatus,
  isPaymentComplete,
  isPaymentFailed,
  listNowPaymentsPaymentsByOrderId,
  type NowPaymentsPaymentRecord,
} from './nowpayments'
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
}

/** Poll NOWPayments API and reconcile local deposit + transaction state. */
export async function syncNowPaymentsDepositStatus(orderId: string): Promise<NowPaymentsSyncResult> {
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

  if (isPaymentComplete(paymentStatus)) {
    await completeDepositFromWebhook(orderId)
    return { orderId, providerStatus: paymentStatus, status: 'completed' }
  }

  if (isPaymentFailed(paymentStatus)) {
    await failDepositFromWebhook(
      orderId,
      paymentStatus === 'expired' ? 'expired' : paymentStatus === 'refunded' ? 'refunded' : 'failed'
    )
    return { orderId, providerStatus: paymentStatus, status: 'failed' }
  }

  if (['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid'].includes(paymentStatus)) {
    const mappedStatus =
      paymentStatus === 'waiting'
        ? 'pending'
        : paymentStatus === 'confirming' || paymentStatus === 'confirmed'
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
      `Deposit via NOWPayments — ${label}. Balance updates when status is finished.`
    )
  }

  return {
    orderId,
    providerStatus: paymentStatus || null,
    status: 'pending',
    message: formatNowPaymentsStatusLabel(paymentStatus || 'unknown'),
  }
}
