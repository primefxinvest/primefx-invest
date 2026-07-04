import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  evaluateAccountFinancialAccess,
  type FinancialAccountAction,
} from '@/lib/security/account-access'

export async function requireActiveAccountForFinancialAction(
  userId: string,
  action: FinancialAccountAction
): Promise<{ allowed: true; accountStatus: string } | { allowed: false; error: string }> {
  const db = createAdminSupabaseClient()
  if (!db) {
    return {
      allowed: false,
      error: 'Account verification is temporarily unavailable. Please try again shortly.',
    }
  }

  const { data, error } = await db
    .from('users')
    .select('account_status')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return { allowed: false, error: 'Account not found. Please sign in again.' }
  }

  const access = evaluateAccountFinancialAccess(data.account_status as string, action)
  if (!access.allowed) {
    return { allowed: false, error: access.error }
  }

  return { allowed: true, accountStatus: access.accountStatus }
}
