import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type { ReferralMemberProfileRow } from '@/lib/referral/member-profile'

export async function fetchReferralMemberProfiles(
  memberIds: string[]
): Promise<Map<string, ReferralMemberProfileRow>> {
  const profiles = new Map<string, ReferralMemberProfileRow>()
  if (!memberIds.length) return profiles

  const admin = createAdminSupabaseClient()
  if (!admin) return profiles

  const { data: users } = await admin
    .from('users')
    .select(
      'id, full_name, email, avatar_url, referral_code, country, kyc_status, is_verified, verification_status, investor_tier'
    )
    .in('id', memberIds)

  users?.forEach((profile) => {
    profiles.set(profile.id as string, profile as ReferralMemberProfileRow)
  })

  return profiles
}
