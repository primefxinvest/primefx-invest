import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createUserNotification, createUserNotificationOnce } from '@/lib/notifications/service'
import { syncUserVerificationFromDidit } from '@/lib/didit/verification-sync'
import { upsertVerificationSession } from '@/lib/didit/verification-sessions'
import type { DiditWebhookEnvelope } from '@/lib/didit/webhook-types'
import { markDiditWebhookProcessed } from '@/lib/didit/webhook-log'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to process Didit webhooks.')
  }
  return db
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

async function resolveUserId(event: DiditWebhookEnvelope): Promise<string | null> {
  const db = getDb()
  const candidates = [
    event.vendor_data,
    typeof event.metadata?.user_id === 'string' ? event.metadata.user_id : undefined,
    event.vendor_user_id,
  ].filter((value): value is string => Boolean(value?.trim()))

  for (const candidate of candidates) {
    if (isUuid(candidate)) {
      const { data } = await db.from('users').select('id').eq('id', candidate).maybeSingle()
      if (data?.id) return data.id as string
    }
  }

  if (event.session_id) {
    const { data: bySession } = await db
      .from('users')
      .select('id')
      .eq('didit_session_id', event.session_id)
      .maybeSingle()
    if (bySession?.id) return bySession.id as string
  }

  return null
}


async function handleSessionEvent(event: DiditWebhookEnvelope) {
  const userId = await resolveUserId(event)
  if (!userId) {
    console.warn('[didit-webhook] no user resolved for session event', event.event_id)
    return
  }

  const sessionId = event.session_id ?? event.business_session_id ?? null

  if (event.webhook_type === 'status.updated' && event.status) {
    await syncUserVerificationFromDidit({
      userId,
      sessionId,
      diditStatus: event.status,
      decision: event.decision ?? null,
      resubmitInfo: event.resubmit_info ?? null,
    })

    if (event.status === 'Abandoned') {
      await createUserNotificationOnce({
        userId,
        dedupeKey: `kyc_abandoned:${sessionId ?? event.event_id}`,
        title: 'Complete your verification',
        message: 'Your identity verification session was abandoned. Resume from your profile when ready.',
        type: 'security',
        metadata: { event: 'kyc_abandoned', sessionId },
      })
    } else if (event.status === 'Expired' || event.status === 'KYC Expired') {
      await createUserNotificationOnce({
        userId,
        dedupeKey: `kyc_expired:${sessionId ?? event.event_id}`,
        title: 'Verification session expired',
        message: 'Your identity verification session expired. Start a new session from your profile.',
        type: 'security',
        metadata: { event: 'kyc_expired', sessionId },
      })
    } else if (event.status === 'Resubmitted') {
      await createUserNotificationOnce({
        userId,
        dedupeKey: `kyc_resubmitted:${sessionId ?? event.event_id}`,
        title: 'Additional verification required',
        message: 'Please resubmit the requested verification steps from your profile.',
        type: 'security',
        metadata: {
          event: 'kyc_resubmitted',
          sessionId,
          nodes: event.resubmit_info?.nodes_to_resubmit ?? [],
        },
      })
    }
    return
  }

  if (event.webhook_type === 'data.updated') {
    const db = getDb()

    if (sessionId && (event.status || event.decision)) {
      await upsertVerificationSession({
        sessionId,
        vendorData: userId,
        status: event.status ?? undefined,
        decision: event.decision ?? null,
        userId,
      })
    }

    await db
      .from('kyc_submissions')
      .update({
        didit_decision: event.decision ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (event.status) {
      await syncUserVerificationFromDidit({
        userId,
        sessionId,
        diditStatus: event.status,
        decision: event.decision ?? null,
        resubmitInfo: event.resubmit_info ?? null,
        notify: false,
      })
    }
  }
}

async function handleUserEntityEvent(event: DiditWebhookEnvelope) {
  const userId = await resolveUserId(event)
  if (!userId) return

  const db = getDb()
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (event.webhook_type === 'user.status.updated') {
    if (event.status === 'BLOCKED') {
      patch.account_status = 'suspended'
      patch.suspended_at = new Date().toISOString()
      patch.suspended_reason = 'Blocked by Didit entity monitoring'
    } else if (event.status === 'ACTIVE' && event.previous_status === 'BLOCKED') {
      patch.account_status = 'active'
      patch.suspended_at = null
      patch.suspended_reason = null
    }
  }

  if (Object.keys(patch).length > 1) {
    await db.from('users').update(patch).eq('id', userId)
  }
}

async function handleTransactionEvent(event: DiditWebhookEnvelope) {
  const userId = await resolveUserId(event)
  if (!userId) return

  if (event.status === 'DECLINED' || event.status === 'IN_REVIEW') {
    await createUserNotification({
      userId,
      title:
        event.status === 'DECLINED' ? 'Transaction declined' : 'Transaction under review',
      message:
        event.status === 'DECLINED'
          ? `A monitored transaction (${event.txn_id ?? event.transaction_id ?? 'unknown'}) was declined.`
          : `A monitored transaction (${event.txn_id ?? event.transaction_id ?? 'unknown'}) requires review.`,
      type: 'security',
      metadata: {
        event: event.webhook_type,
        transactionId: event.transaction_id,
        txnId: event.txn_id,
        status: event.status,
        severity: event.severity,
      },
    })
  }
}

export async function processDiditWebhookEvent(event: DiditWebhookEnvelope) {
  try {
    switch (event.webhook_type) {
      case 'status.updated':
      case 'data.updated':
        await handleSessionEvent(event)
        break
      case 'user.status.updated':
      case 'user.data.updated':
        await handleUserEntityEvent(event)
        break
      case 'business.status.updated':
      case 'business.data.updated':
        break
      case 'activity.created':
        break
      case 'transaction.created':
      case 'transaction.status.updated':
        await handleTransactionEvent(event)
        break
      default:
        console.info('[didit-webhook] unhandled webhook_type', event.webhook_type)
    }

    await markDiditWebhookProcessed(event.event_id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed'
    console.error('[didit-webhook] processing error:', message, event.event_id)
    await markDiditWebhookProcessed(event.event_id, message)
    throw err
  }
}
