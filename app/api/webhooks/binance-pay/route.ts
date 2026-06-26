import { NextResponse } from 'next/server'
import { verifyBinancePayWebhook } from '@/lib/payments/binance-pay'
import {
  completeDepositFromWebhook,
  failDepositFromWebhook,
} from '@/lib/payments/service'
import { logPaymentWebhook } from '@/lib/payments/wallet-ledger'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const timestamp = request.headers.get('BinancePay-Timestamp') ?? ''
  const nonce = request.headers.get('BinancePay-Nonce') ?? ''
  const signature = request.headers.get('BinancePay-Signature') ?? ''
  const certificateSerial = request.headers.get('BinancePay-Certificate-SN') ?? ''

  let payload: Record<string, unknown> = {}
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    await logPaymentWebhook({
      provider: 'binance_pay',
      payload: { rawBody },
      signatureValid: false,
      processed: false,
      errorMessage: 'Invalid JSON payload',
    })
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'Invalid payload' }, { status: 400 })
  }

  const bizType = String(payload.bizType ?? payload.bizStatus ?? '')
  const data = (payload.data ?? {}) as Record<string, unknown>
  const merchantTradeNo = String(data.merchantTradeNo ?? '')

  const signatureValid = await verifyBinancePayWebhook(
    timestamp,
    nonce,
    rawBody,
    signature,
    certificateSerial
  )

  if (!signatureValid) {
    await logPaymentWebhook({
      provider: 'binance_pay',
      paymentId: merchantTradeNo || undefined,
      eventType: bizType,
      payload,
      signatureValid: false,
      processed: false,
      errorMessage: 'Invalid webhook signature',
    })
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'Invalid signature' }, { status: 401 })
  }

  try {
    const status = String(data.status ?? payload.bizStatus ?? '').toUpperCase()

    if (bizType === 'PAY_SUCCESS' || status === 'PAID') {
      await completeDepositFromWebhook(merchantTradeNo)
    } else if (bizType === 'PAY_CLOSED' || status === 'CANCELED' || status === 'EXPIRED') {
      await failDepositFromWebhook(merchantTradeNo, status === 'EXPIRED' ? 'expired' : 'cancelled')
    } else if (bizType === 'PAY_ERROR' || status === 'ERROR') {
      await failDepositFromWebhook(merchantTradeNo, 'failed')
    }

    await logPaymentWebhook({
      provider: 'binance_pay',
      paymentId: merchantTradeNo,
      eventType: bizType || status,
      payload,
      signatureValid: true,
      processed: true,
    })

    return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null })
  } catch (err) {
    await logPaymentWebhook({
      provider: 'binance_pay',
      paymentId: merchantTradeNo,
      eventType: bizType,
      payload,
      signatureValid: true,
      processed: false,
      errorMessage: err instanceof Error ? err.message : 'Processing failed',
    })
    return NextResponse.json({ returnCode: 'FAIL', returnMessage: 'Processing error' }, { status: 500 })
  }
}
