'use server'

import { revalidatePath } from 'next/cache'
import { assertModuleAccess, getAdminContext } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import {
  getReferralAccessForUser,
  getReferralProgramEnabled,
  getReferralProgramEnabledAdmin,
  setReferralProgramEnabled,
  setUserReferralAccess,
} from '@/lib/referral/settings'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function fetchReferralProgramEnabledAction(): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return Boolean(user)
}

export async function fetchReferralAccessAction() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { globalEnabled: true, userEnabled: false, canAccess: false }
  }

  return getReferralAccessForUser(user.id)
}

export async function fetchReferralProgramAdminStatusAction() {
  return getReferralProgramEnabledAdmin()
}

export async function adminSetReferralProgramEnabled(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getAdminContext()
    if (!context) {
      return { success: false, error: 'Unauthorized' }
    }

    assertModuleAccess(context, 'rewards_referral')
    await setReferralProgramEnabled(enabled, context.userId)

    await logAdminAction({
      context,
      module: 'rewards_referral',
      action: enabled ? 'referral_program_enabled' : 'referral_program_disabled',
      afterState: { referral_program_enabled: enabled },
    })

    revalidatePath('/admin/rewards')
    revalidatePath('/referral')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update referral program',
    }
  }
}

export async function adminSetUserReferralAccess(
  userId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getAdminContext()
    if (!context) {
      return { success: false, error: 'Unauthorized' }
    }

    assertModuleAccess(context, 'rewards_referral')
    await setUserReferralAccess(userId, enabled)

    await logAdminAction({
      context,
      module: 'rewards_referral',
      action: enabled ? 'referral_user_access_granted' : 'referral_user_access_revoked',
      targetUserId: userId,
      afterState: { referral_access_enabled: enabled },
    })

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/referral')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user referral access',
    }
  }
}
