import 'server-only'

import {
  fetchDiditSessionDecision,
  updateDiditSessionStatus,
  type DiditSessionDecision,
} from '@/lib/didit/client'
import {
  getVerificationSessionBySessionId,
  upsertVerificationSession,
  type VerificationSessionRecord,
} from '@/lib/didit/verification-sessions'
import { syncUserVerificationFromDidit } from '@/lib/didit/verification-sync'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function resolveUserIdForSession(
  sessionId: string,
  vendorData?: string | null
): Promise<string | null> {
  const db = createAdminSupabaseClient()
  if (!db) return null

  if (isUuid(vendorData)) {
    const { data } = await db.from('users').select('id').eq('id', vendorData).maybeSingle()
    if (data?.id) return data.id as string
  }

  const { data: bySession } = await db
    .from('users')
    .select('id')
    .eq('didit_session_id', sessionId)
    .maybeSingle()

  return (bySession?.id as string | undefined) ?? null
}

async function persistDecision(
  sessionId: string,
  decision: DiditSessionDecision
): Promise<VerificationSessionRecord | null> {
  const userId = await resolveUserIdForSession(sessionId, decision.vendor_data ?? null)

  const record = await upsertVerificationSession({
    sessionId,
    vendorData: decision.vendor_data ?? userId,
    status: decision.status ?? 'In Progress',
    decision: decision.decision ?? null,
    workflowId:
      typeof decision.metadata?.workflow_id === 'string'
        ? decision.metadata.workflow_id
        : null,
    userId,
  })

  const diditStatus = decision.status ?? 'In Progress'
  const terminalStatuses = ['Approved', 'Declined', 'Expired', 'KYC Expired']

  if (userId && terminalStatuses.includes(diditStatus)) {
    await syncUserVerificationFromDidit({
      userId,
      sessionId,
      diditStatus,
      decision: decision.decision ?? null,
    })
  } else if (userId) {
    await syncUserVerificationFromDidit({
      userId,
      sessionId,
      diditStatus,
      decision: decision.decision ?? null,
      notify: false,
    })
  }

  return record ?? (await getVerificationSessionBySessionId(sessionId))
}

export async function refreshDiditSessionFromApi(
  sessionId: string
): Promise<VerificationSessionRecord> {
  const decision = await fetchDiditSessionDecision(sessionId)
  const record = await persistDecision(sessionId, decision)
  if (!record) {
    throw new Error('Failed to persist verification session.')
  }
  return record
}

export async function applyDiditSessionStatusOverride(input: {
  sessionId: string
  newStatus: 'Approved' | 'Declined'
  comment?: string
}): Promise<VerificationSessionRecord> {
  await updateDiditSessionStatus(input.sessionId, input.newStatus, input.comment)
  const decision = await fetchDiditSessionDecision(input.sessionId)
  const record = await persistDecision(input.sessionId, decision)
  if (!record) {
    throw new Error('Failed to persist verification session after status override.')
  }
  return record
}

export const PENDING_DIDIT_STATUSES = ['Not Started', 'In Progress', 'In Review'] as const

export async function listPendingVerificationSessionIds(): Promise<string[]> {
  const db = createAdminSupabaseClient()
  if (!db) return []

  const { data } = await db
    .from('verification_sessions')
    .select('session_id')
    .in('status', [...PENDING_DIDIT_STATUSES])
    .order('updated_at', { ascending: true })

  return (data ?? []).map((row) => row.session_id as string)
}
