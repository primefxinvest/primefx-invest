'use server'

import { revalidatePath } from 'next/cache'
import { INVESTMENT_TERMS_VERSION } from '@/lib/legal/investment-terms'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTermsAcknowledgementState } from '@/lib/terms/server'

export async function checkTermsAcknowledgementAction() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { required: false, version: '' }

  return getTermsAcknowledgementState(user.id)
}

export async function acknowledgeTermsAction(version: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false as const, error: 'Unauthorized' }
  if (!version?.trim() || version !== INVESTMENT_TERMS_VERSION) {
    return { success: false as const, error: 'Invalid terms version' }
  }

  const { error } = await supabase.from('user_terms_acknowledgements').upsert(
    {
      user_id: user.id,
      terms_version: version,
      acknowledged_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,terms_version' }
  )

  if (error) {
    console.error('Terms acknowledgement failed:', error)
    return { success: false as const, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true as const }
}
