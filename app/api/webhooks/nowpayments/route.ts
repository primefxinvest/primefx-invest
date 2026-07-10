import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  isPaymentComplete,
  isPaymentFailed,
  verifyNowPaymentsSignature,
} from '@/lib/payments/nowpayments'
import {
  completeDepositFromWebhook,
  failDepositFromWebhook,
} from '@/lib/payments/service'
import { logPaymentWebhook, updatePaymentStatus } from '@/lib/payments/wallet-ledger'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-nowpayments-sig') ?? ''

  let payload: Record<string, unknown> = {}
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const signatureValid = verifyNowPaymentsSignature(rawBody, signature)
  const orderId = String(payload.order_id ?? '')
  const paymentStatus = String(payload.payment_status ?? '').toLowerCase()

  if (!signatureValid) {
    await logPaymentWebhook({
      provider: 'now_payments',
      paymentId: orderId || String(payload.payment_id ?? ''),
      eventType: paymentStatus,
      payload,
      signatureValid: false,
      processed: false,
      errorMessage: 'Invalid IPN signature',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    if (!orderId) {
      throw new Error('Missing order_id in webhook payload.')
    }

    if (isPaymentComplete(paymentStatus)) {
      await completeDepositFromWebhook(orderId)
      revalidatePath('/wallet')
      revalidatePath('/wallet/deposit/success')
      revalidatePath('/dashboard')
      revalidatePath('/transactions')
    } else if (isPaymentFailed(paymentStatus)) {
      await failDepositFromWebhook(
        orderId,
        paymentStatus === 'expired' ? 'expired' : paymentStatus === 'refunded' ? 'refunded' : 'failed'
      )
      revalidatePath('/wallet/deposit/failed')
      revalidatePath('/transactions')
    } else if (['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid'].includes(paymentStatus)) {
      const mappedStatus =
        paymentStatus === 'waiting'
          ? 'pending'
          : paymentStatus === 'confirming' || paymentStatus === 'confirmed'
            ? 'confirming'
            : 'processing'

      await updatePaymentStatus(orderId, mappedStatus, {
        provider_payment_id: String(payload.payment_id ?? ''),
        pay_amount: payload.pay_amount != null ? Number(payload.pay_amount) : undefined,
        metadata: payload,
      })
    }

    await logPaymentWebhook({
      provider: 'now_payments',
      paymentId: orderId,
      eventType: paymentStatus,
      payload,
      signatureValid: true,
      processed: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logPaymentWebhook({
      provider: 'now_payments',
      paymentId: orderId,
      eventType: paymentStatus,
      payload,
      signatureValid: true,
      processed: false,
      errorMessage: err instanceof Error ? err.message : 'Processing failed',
    })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
