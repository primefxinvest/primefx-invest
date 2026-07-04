import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function resolveUserId(vendorData?: string | null, explicitUserId?: string | null): string | null {
  if (explicitUserId) return explicitUserId
  if (vendorData && isUuid(vendorData)) return vendorData
  return null
}

export type VerificationSessionRecord = {
  id: string
  session_id: string
  vendor_data: string | null
  status: string
  decision: Record<string, unknown> | null
  workflow_id: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export async function upsertVerificationSession(
  input: {
    sessionId: string
    vendorData?: string | null
    status?: string | null
    decision?: Record<string, unknown> | null
    workflowId?: string | null
    userId?: string | null
  },
  db: SupabaseClient | null = createAdminSupabaseClient()
): Promise<VerificationSessionRecord | null> {
  if (!db) return null

  const now = new Date().toISOString()
  const userId = resolveUserId(input.vendorData, input.userId)

  let status = input.status
  if (status == null || status === '') {
    const existing = await getVerificationSessionBySessionId(input.sessionId)
    status = existing?.status ?? 'Not Started'
  }

  const row = {
    session_id: input.sessionId,
    vendor_data: input.vendorData ?? userId,
    status,
    decision: input.decision ?? null,
    workflow_id: input.workflowId ?? null,
    user_id: userId,
    updated_at: now,
  }

  const { data, error } = await db
    .from('verification_sessions')
    .upsert(row, { onConflict: 'session_id' })
    .select('*')
    .single()

  if (error) {
    console.error('[verification_sessions] upsert failed:', error.message)
    return null
  }

  return data as VerificationSessionRecord
}

export async function getVerificationSessionBySessionId(
  sessionId: string
): Promise<VerificationSessionRecord | null> {
  const db = createAdminSupabaseClient()
  if (!db) return null

  const { data } = await db
    .from('verification_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  return (data as VerificationSessionRecord | null) ?? null
}
