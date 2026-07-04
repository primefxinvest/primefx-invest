import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { notifyKycStatusChange } from '@/lib/notifications/service'
import { upsertVerificationSession } from '@/lib/didit/verification-sessions'
import { applyDiditProfileFieldsFromDecision } from '@/lib/didit/apply-profile-from-decision'
import {
  extractProfileFieldsFromDiditDecision,
} from '@/lib/didit/profile-from-decision'
import {
  mapDiditStatusToKycStatus,
  mapDiditStatusToVerificationStatus,
  type UserVerificationStatus,
} from '@/lib/didit/status-maps'

export type { UserVerificationStatus } from '@/lib/didit/status-maps'
export { mapDiditStatusToKycStatus, mapDiditStatusToVerificationStatus } from '@/lib/didit/status-maps'

export async function syncUserVerificationFromDidit(input: {
  userId: string
  sessionId?: string | null
  diditStatus: string | null | undefined
  decision?: Record<string, unknown> | null
  resubmitInfo?: Record<string, unknown> | null
  notify?: boolean
}) {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to sync Didit verification.')
  }

  const { data: currentUser } = await db
    .from('users')
    .select('kyc_status, verification_status, is_verified')
    .eq('id', input.userId)
    .maybeSingle()

  const previousKycStatus = (currentUser?.kyc_status as string | undefined) ?? 'Pending'
  const previousVerificationStatus =
    (currentUser?.verification_status as UserVerificationStatus | undefined) ?? 'pending'

  const verificationStatus = mapDiditStatusToVerificationStatus(input.diditStatus)
  const kycStatus = mapDiditStatusToKycStatus(input.diditStatus)
  const kycStatusChanged = previousKycStatus !== kycStatus
  const verificationStatusChanged = previousVerificationStatus !== verificationStatus
  const now = new Date().toISOString()
  const isVerified = verificationStatus === 'approved'

  const userPatch: Record<string, unknown> = {
    is_verified: isVerified,
    verification_status: verificationStatus,
    kyc_status: kycStatus,
    kyc_verification_detail: (input.diditStatus ?? 'pending')
      .toLowerCase()
      .replace(/\s+/g, '_'),
    updated_at: now,
  }

  if (isVerified) {
    userPatch.verified_at = now
    userPatch.kyc_submitted_at = now
    userPatch.kyc_rejection_reason = null
  } else if (verificationStatus === 'declined') {
    userPatch.kyc_rejection_reason = 'Declined by Didit identity verification'
  }

  if (input.sessionId) {
    userPatch.didit_session_id = input.sessionId
    await upsertVerificationSession({
      sessionId: input.sessionId,
      vendorData: input.userId,
      status: input.diditStatus ?? 'In Progress',
      decision: input.decision ?? null,
      userId: input.userId,
    })
  }

  await db.from('users').update(userPatch).eq('id', input.userId)

  if (isVerified && input.decision) {
    try {
      await applyDiditProfileFieldsFromDecision(input.userId, input.decision)
    } catch (err) {
      console.error('[didit] failed to apply profile fields from decision:', err)
    }
  }

  const { data: existingSubmission } = await db
    .from('kyc_submissions')
    .select('id')
    .eq('user_id', input.userId)
    .maybeSingle()

  const reviewStatus =
    verificationStatus === 'approved'
      ? 'verified'
      : verificationStatus === 'declined'
        ? 'rejected'
        : 'submitted'

  const profileFields =
    isVerified && input.decision
      ? extractProfileFieldsFromDiditDecision(input.decision)
      : null

  const submissionPatch = {
    didit_session_id: input.sessionId ?? null,
    didit_decision: input.decision ?? null,
    didit_resubmit_info: input.resubmitInfo ?? null,
    review_status: reviewStatus,
    reviewed_at: verificationStatus === 'approved' || verificationStatus === 'declined' ? now : null,
    updated_at: now,
    ...(profileFields?.country ? { country: profileFields.country } : {}),
  }

  if (existingSubmission?.id) {
    await db.from('kyc_submissions').update(submissionPatch).eq('user_id', input.userId)
  } else if (input.sessionId) {
    await db.from('kyc_submissions').insert({
      user_id: input.userId,
      id_type: 'national_id',
      id_number: 'didit-external',
      country: profileFields?.country ?? 'Unknown',
      document_front_path: 'didit/external',
      selfie_path: 'didit/external',
      submitted_at: now,
      ...submissionPatch,
    })
  }

  if (
    input.notify !== false &&
    kycStatusChanged &&
    (kycStatus === 'Verified' || kycStatus === 'Rejected')
  ) {
    await notifyKycStatusChange(input.userId, kycStatus)
  }

  return {
    userId: input.userId,
    verificationStatus,
    kycStatus,
    isVerified,
    statusChanged: kycStatusChanged || verificationStatusChanged,
  }
}

export async function resolveUserIdFromDiditSession(sessionId: string): Promise<string | null> {
  const db = createAdminSupabaseClient()
  if (!db) return null

  const { data } = await db
    .from('users')
    .select('id')
    .eq('didit_session_id', sessionId)
    .maybeSingle()

  return (data?.id as string | undefined) ?? null
}
