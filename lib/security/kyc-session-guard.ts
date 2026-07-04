import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveDiditVendorData } from '@/lib/didit/decision-normalize'
import { getVerificationSessionBySessionId } from '@/lib/didit/verification-sessions'

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export type DiditSessionOwnershipResult =
  | { ok: true }
  | { ok: false; reason: string }

export async function assertDiditSessionOwnedByUser(input: {
  sessionId: string
  userId: string
  adminDb: SupabaseClient
  diditApiResponse?: Record<string, unknown>
}): Promise<DiditSessionOwnershipResult> {
  const { sessionId, userId, adminDb, diditApiResponse } = input

  const storedSession = await getVerificationSessionBySessionId(sessionId)
  if (storedSession?.user_id && storedSession.user_id !== userId) {
    return { ok: false, reason: 'Verification session belongs to another account.' }
  }

  const { data: profile } = await adminDb
    .from('users')
    .select('didit_session_id')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.didit_session_id && profile.didit_session_id !== sessionId) {
    return { ok: false, reason: 'Session does not match your active verification.' }
  }

  if (diditApiResponse) {
    const vendorData = resolveDiditVendorData(diditApiResponse)
    if (vendorData && isUuid(vendorData) && vendorData !== userId) {
      return { ok: false, reason: 'Didit session vendor data does not match your account.' }
    }
    if (vendorData && !isUuid(vendorData)) {
      return { ok: false, reason: 'Invalid Didit session vendor data.' }
    }
  }

  return { ok: true }
}
