'use server'

import { revalidatePath } from 'next/cache'
import { acknowledgeTerms, userNeedsTermsAcknowledgement } from '@/lib/terms/service'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function checkTermsAcknowledgementAction() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { required: false, version: '' }
  return userNeedsTermsAcknowledgement(user.id)
}

export async function acknowledgeTermsAction(version: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false as const, error: 'Unauthorized' }
  await acknowledgeTerms(user.id, version)
  revalidatePath('/dashboard')
  return { success: true as const }
}
