import 'server-only'

import { INVESTMENT_TERMS_VERSION } from '@/lib/legal/investment-terms'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getTermsAcknowledgementState(userId: string) {
  const supabase = await createServerSupabaseClient()
  const version = INVESTMENT_TERMS_VERSION

  const { data, error } = await supabase
    .from('user_terms_acknowledgements')
    .select('id')
    .eq('user_id', userId)
    .eq('terms_version', version)
    .maybeSingle()

  if (error) {
    console.error('Terms acknowledgement check failed:', error)
    return { required: false, version }
  }

  return { required: !data, version }
}
