'use server'

import { revalidatePath } from 'next/cache'
import { executeInvestment } from '@/lib/invest/service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'

interface ProcessInvestmentInput {
  planId: string
  planName: string
  amount: number
}

export async function processInvestment(
  input: ProcessInvestmentInput
): Promise<{
  success: boolean
  error?: string
  referenceId?: string
  investorTierUpgraded?: string
}> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in to invest.' }
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'investment')
  if (!account.allowed) {
    return { success: false, error: account.error }
  }

  const result = await executeInvestment({
    userId: user.id,
    planId: input.planId,
    amount: input.amount,
  })

  if (result.success) {
    revalidatePath('/invest')
    revalidatePath('/portfolio')
    revalidatePath('/dashboard')
    revalidatePath('/wallet')
    revalidatePath('/transactions')
    revalidatePath('/profile')
  }

  return {
    success: result.success,
    error: result.error,
    referenceId: result.referenceId,
    investorTierUpgraded: result.investorTierUpgraded,
  }
}
