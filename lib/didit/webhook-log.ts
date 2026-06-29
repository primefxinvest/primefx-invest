import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type { DiditSignatureMethod, DiditWebhookEnvelope } from '@/lib/didit/webhook-types'

function getDb() {
  return createAdminSupabaseClient()
}

export async function logDiditWebhookFailure(input: {
  rawBody: string
  reason: string
  signatureValid?: boolean
  parsed?: Partial<DiditWebhookEnvelope>
}) {
  const db = getDb()
  if (!db) {
    console.error('[didit-webhook] signature failure (no db):', input.reason, input.rawBody.slice(0, 500))
    return
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(input.rawBody) as Record<string, unknown>
  } catch {
    payload = { _raw_preview: input.rawBody.slice(0, 2000) }
  }

  const eventId = String(input.parsed?.event_id ?? payload.event_id ?? '')
  if (!eventId) {
    console.error('[didit-webhook] signature failure:', input.reason, input.rawBody.slice(0, 500))
    return
  }

  await db.from('didit_webhook_logs').upsert(
    {
      event_id: eventId,
      webhook_type: String(input.parsed?.webhook_type ?? payload.webhook_type ?? 'unknown'),
      session_id: input.parsed?.session_id ?? (payload.session_id as string | undefined) ?? null,
      transaction_id:
        input.parsed?.transaction_id ?? (payload.transaction_id as string | undefined) ?? null,
      status: input.parsed?.status ?? (payload.status as string | undefined) ?? null,
      payload,
      signature_valid: input.signatureValid ?? false,
      processed: false,
      processing_error: input.reason,
    },
    { onConflict: 'event_id', ignoreDuplicates: true }
  )
}

export type DiditWebhookClaimResult = 'new' | 'duplicate_processed' | 'duplicate_pending'

export async function claimDiditWebhookEvent(input: {
  event: DiditWebhookEnvelope
  signatureMethod: DiditSignatureMethod
}): Promise<DiditWebhookClaimResult> {
  const db = getDb()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to process Didit webhooks.')
  }

  const { data: existing } = await db
    .from('didit_webhook_logs')
    .select('processed')
    .eq('event_id', input.event.event_id)
    .maybeSingle()

  if (existing?.processed) {
    return 'duplicate_processed'
  }

  if (existing) {
    return 'duplicate_pending'
  }

  const { error } = await db.from('didit_webhook_logs').insert({
    event_id: input.event.event_id,
    webhook_type: input.event.webhook_type,
    session_id: input.event.session_id ?? null,
    transaction_id: input.event.transaction_id ?? null,
    status: input.event.status ?? null,
    payload: input.event as unknown as Record<string, unknown>,
    signature_method: input.signatureMethod,
    signature_valid: true,
    processed: false,
  })

  if (error?.code === '23505') {
    const { data: row } = await db
      .from('didit_webhook_logs')
      .select('processed')
      .eq('event_id', input.event.event_id)
      .maybeSingle()
    return row?.processed ? 'duplicate_processed' : 'duplicate_pending'
  }

  if (error) {
    throw new Error(error.message)
  }

  return 'new'
}

export async function markDiditWebhookProcessed(
  eventId: string,
  processingError?: string | null
) {
  const db = getDb()
  if (!db) return

  await db
    .from('didit_webhook_logs')
    .update({
      processed: !processingError,
      processing_error: processingError ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId)
}
