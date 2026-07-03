'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requestInvestmentCapitalWithdrawal } from '@/lib/invest/capital-withdrawal'

export async function submitCapitalWithdrawalAction(input: {
  investmentId: string
  supportNote?: string
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false as const, error: 'You must be signed in.' }
  }

  try {
    const result = await requestInvestmentCapitalWithdrawal({
      userId: user.id,
      investmentId: input.investmentId,
      supportNote: input.supportNote,
    })
    revalidatePath('/portfolio')
    revalidatePath('/wallet')
    return { success: true as const, ...result }
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Capital withdrawal request failed.',
    }
  }
}
