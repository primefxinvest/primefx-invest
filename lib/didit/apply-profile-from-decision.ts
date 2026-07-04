import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  extractProfileFieldsFromDiditDecision,
  formatDiditDateForProfile,
  hasDiditProfileFields,
} from '@/lib/didit/profile-from-decision'

export async function applyDiditProfileFieldsFromDecision(
  userId: string,
  decision: Record<string, unknown> | null | undefined
): Promise<{ applied: boolean; fields: ReturnType<typeof extractProfileFieldsFromDiditDecision> }> {
  const fields = extractProfileFieldsFromDiditDecision(decision)
  if (!hasDiditProfileFields(fields)) {
    return { applied: false, fields }
  }

  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to apply Didit profile fields.')
  }

  const userPatch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (fields.dateOfBirth) {
    userPatch.date_of_birth = fields.dateOfBirth
  }
  if (fields.address) {
    userPatch.address = fields.address
  }
  if (fields.country) {
    userPatch.country = fields.country
  }

  const { error: userError } = await db.from('users').update(userPatch).eq('id', userId)
  if (userError) {
    throw new Error(userError.message)
  }

  const { data: authUser, error: authGetError } = await db.auth.admin.getUserById(userId)
  if (!authGetError && authUser.user) {
    const metadata = { ...(authUser.user.user_metadata ?? {}) }
    if (fields.dateOfBirth) {
      metadata.date_of_birth = formatDiditDateForProfile(fields.dateOfBirth)
    }
    if (fields.address) {
      metadata.address = fields.address
    }
    if (fields.country) {
      metadata.country = fields.country
    }

    await db.auth.admin.updateUserById(userId, { user_metadata: metadata })
  }

  if (fields.country) {
    await db
      .from('kyc_submissions')
      .update({ country: fields.country, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  return { applied: true, fields }
}
