import { after, NextResponse } from 'next/server'
import { getDiditWebhookSecret } from '@/lib/didit/env'
import { claimDiditWebhookEvent, logDiditWebhookFailure } from '@/lib/didit/webhook-log'
import { processDiditWebhookEvent } from '@/lib/didit/webhook-process'
import { verifyDiditWebhook } from '@/lib/didit/webhook-verify'

export const runtime = 'nodejs'

export async function handleDiditWebhookRequest(request: Request): Promise<Response> {
  const secret = getDiditWebhookSecret()
  if (!secret) {
    console.error('[didit-webhook] DIDIT_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const timestampHeader = request.headers.get('X-Timestamp')
  const verification = verifyDiditWebhook({
    rawBody,
    secret,
    timestampHeader,
    signatureV2: request.headers.get('X-Signature-V2'),
    signatureRaw: request.headers.get('X-Signature'),
    signatureSimple: request.headers.get('X-Signature-Simple'),
  })

  if (!verification.ok) {
    await logDiditWebhookFailure({
      rawBody,
      reason: verification.reason,
      parsed: verification.parsed,
    })
    return NextResponse.json({ error: verification.reason }, { status: 401 })
  }

  const { parsed, method } = verification

  if (!parsed.event_id || !parsed.webhook_type) {
    return NextResponse.json({ error: 'Invalid webhook envelope' }, { status: 400 })
  }

  let claim: Awaited<ReturnType<typeof claimDiditWebhookEvent>>
  try {
    claim = await claimDiditWebhookEvent({ event: parsed, signatureMethod: method })
  } catch (err) {
    console.error('[didit-webhook] failed to claim event:', err)
    return NextResponse.json({ error: 'Failed to record webhook' }, { status: 500 })
  }

  if (claim === 'duplicate_processed') {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  after(async () => {
    try {
      await processDiditWebhookEvent(parsed)
    } catch (err) {
      console.error('[didit-webhook] async processing failed:', err)
    }
  })

  return NextResponse.json({
    ok: true,
    ...(claim === 'duplicate_pending' ? { duplicate: true, retry: true } : {}),
  })
}
