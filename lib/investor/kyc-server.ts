import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getKycBlockReason,
  resolveEffectiveKycStatus,
  type FinancialAction,
} from '@/lib/investor/kyc'
import { INVESTOR_RULES } from '@/lib/investor/rules'

export async function loadUserKycStatus(userId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const select = 'kyc_status, is_verified, verification_status'

  if (admin) {
    const { data } = await admin.from('users').select(select).eq('id', userId).maybeSingle()
    return resolveEffectiveKycStatus(data)
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('users').select(select).eq('id', userId).maybeSingle()

  return resolveEffectiveKycStatus(data)
}

function isKycRequiredForAction(action: FinancialAction): boolean {
  if (!INVESTOR_RULES.compliance.kycRequiredForFullAccess) return false

  switch (action) {
    case 'deposit':
      return INVESTOR_RULES.financial.kycRequiredForDeposit
    case 'withdrawal':
      return INVESTOR_RULES.financial.kycRequiredForWithdrawal
    case 'investment':
      return INVESTOR_RULES.financial.kycRequiredForInvestment
    case 'transfer':
    case 'convert':
    case 'payment':
      return INVESTOR_RULES.financial.kycRequiredForTransfers
    default:
      return true
  }
}

export async function requireVerifiedKyc(
  userId: string,
  action: FinancialAction
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  if (!isKycRequiredForAction(action)) {
    return { allowed: true }
  }

  const status = await loadUserKycStatus(userId)
  const blockReason = getKycBlockReason(status, action)

  if (blockReason) {
    return { allowed: false, error: blockReason }
  }

  return { allowed: true }
}
