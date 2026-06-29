'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ensureUserReferralCode } from '@/lib/referral/server'

export async function ensureMyReferralCode(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, referral_code')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.referral_code) {
    return profile.referral_code as string
  }

  return ensureUserReferralCode(user.id, profile?.full_name as string | undefined)
}
