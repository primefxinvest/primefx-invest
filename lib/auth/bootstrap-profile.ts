'use server'

import { createAdminSupabaseClient, getServiceRoleKeyIssue } from '@/lib/supabase/admin-server'
import {
  ensureUserReferralCode,
  normalizeReferralCode,
  recordReferralForNewUser,
} from '@/lib/referral/server'

export async function bootstrapUserProfile(input: {
  userId: string
  email: string
  fullName: string
  investorTier: string
  referralCode?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminSupabaseClient()
  const keyIssue = getServiceRoleKeyIssue()
  if (!admin || keyIssue) {
    return {
      success: false,
      error:
        keyIssue === 'wrong-role' || keyIssue === 'same-as-anon'
          ? 'SUPABASE_SERVICE_ROLE_KEY is set to the anon key. Use the service_role secret from Supabase → Project Settings → API.'
          : 'Server profile setup is not configured. Add the real SUPABASE_SERVICE_ROLE_KEY to .env and run migration 005_signup_bootstrap.sql.',
    }
  }

  const referralCode = normalizeReferralCode(input.referralCode)

  const { error: userError } = await admin.from('users').upsert(
    {
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
      investor_tier: input.investorTier,
    },
    { onConflict: 'id' }
  )

  if (userError) {
    return { success: false, error: userError.message }
  }

  await ensureUserReferralCode(input.userId, input.fullName)

  const { error: walletError } = await admin.from('wallet_balances').upsert(
    {
      user_id: input.userId,
      available_balance: 0,
      pending_balance: 0,
      bonus_balance: 0,
      total_balance: 0,
    },
    { onConflict: 'user_id' }
  )

  if (walletError) {
    return { success: false, error: walletError.message }
  }

  const { data: existingPortfolio } = await admin
    .from('portfolios')
    .select('id')
    .eq('user_id', input.userId)
    .maybeSingle()

  if (!existingPortfolio) {
    const { error: portfolioError } = await admin.from('portfolios').insert({
      user_id: input.userId,
    })

    if (portfolioError) {
      return { success: false, error: portfolioError.message }
    }
  }

  await recordReferralForNewUser(input.userId, referralCode)

  return { success: true }
}
