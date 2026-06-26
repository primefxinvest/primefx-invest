'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getKycFinancialSummary,
  isKycVerified,
  normalizeKycStatus,
  type KycStatus,
} from '@/lib/investor/kyc'

export interface FinancialKycAccess {
  verified: boolean
  status: KycStatus
  summary: string | null
}

export async function getFinancialKycAccess(): Promise<FinancialKycAccess> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      verified: false,
      status: 'pending',
      summary: 'Sign in to verify your identity status.',
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', user.id)
    .maybeSingle()

  const status = normalizeKycStatus(profile?.kyc_status as string | undefined)
  const verified = isKycVerified(profile?.kyc_status as string | undefined)

  return {
    verified,
    status,
    summary: verified ? null : getKycFinancialSummary(profile?.kyc_status as string | undefined),
  }
}
