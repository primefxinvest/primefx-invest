import { NextResponse } from 'next/server'
import { verifyNowPaymentsSignature } from '@/lib/payments/nowpayments'
import { completeWithdrawalFromWebhook, failWithdrawalFromWebhook } from '@/lib/payments/service'
import { logPaymentWebhook } from '@/lib/payments/wallet-ledger'

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
  const orderId = String(payload.extra_id ?? payload.order_id ?? '')
  const status = String(payload.status ?? payload.withdrawal_status ?? '').toLowerCase()

  if (!signatureValid) {
    await logPaymentWebhook({
      provider: 'now_payments',
      paymentId: orderId,
      eventType: status,
      payload,
      signatureValid: false,
      processed: false,
      errorMessage: 'Invalid payout IPN signature',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    if (['finished', 'completed', 'sent'].includes(status)) {
      await completeWithdrawalFromWebhook(orderId, payload)
    } else if (['failed', 'rejected', 'cancelled'].includes(status)) {
      await failWithdrawalFromWebhook(
        orderId,
        status === 'cancelled' ? 'cancelled' : status === 'rejected' ? 'rejected' : 'failed'
      )
    }

    await logPaymentWebhook({
      provider: 'now_payments',
      paymentId: orderId,
      eventType: `payout:${status}`,
      payload,
      signatureValid: true,
      processed: true,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logPaymentWebhook({
      provider: 'now_payments',
      paymentId: orderId,
      eventType: `payout:${status}`,
      payload,
      signatureValid: true,
      processed: false,
      errorMessage: err instanceof Error ? err.message : 'Processing failed',
    })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
