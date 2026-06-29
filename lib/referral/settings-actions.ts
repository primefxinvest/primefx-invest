'use server'

import { revalidatePath } from 'next/cache'
import { assertModuleAccess, getAdminContext } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import {
  getReferralProgramEnabled,
  getReferralProgramEnabledAdmin,
  setReferralProgramEnabled,
} from '@/lib/referral/settings'

export async function fetchReferralProgramEnabledAction(): Promise<boolean> {
  return getReferralProgramEnabled()
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
