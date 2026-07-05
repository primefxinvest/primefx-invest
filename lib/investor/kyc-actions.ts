'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getKycFinancialSummary,
  isKycVerified,
  normalizeKycStatus,
  resolveEffectiveKycStatus,
  type KycStatus,
} from '@/lib/investor/kyc'

export interface FinancialKycAccess {
  verified: boolean
  status: KycStatus
  summary: string | null
  fetchError?: boolean
}

export async function getFinancialKycAccess(): Promise<FinancialKycAccess> {
  try {
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

    const { data: profile, error } = await supabase
      .from('users')
      .select('kyc_status, is_verified, verification_status')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[KYC] Failed to fetch financial access:', error.message)
      throw new Error('Unable to load verification status.')
    }

    const effectiveStatus = resolveEffectiveKycStatus(profile)
    const status = normalizeKycStatus(effectiveStatus)
    const verified = isKycVerified(effectiveStatus)

    return {
      verified,
      status,
      summary: verified ? null : getKycFinancialSummary(effectiveStatus),
    }
  } catch (err) {
    console.error('[KYC] getFinancialKycAccess error:', err)
    throw err instanceof Error ? err : new Error('Unable to load verification status.')
  }
}
