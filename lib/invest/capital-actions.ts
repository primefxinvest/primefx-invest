'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requestInvestmentCapitalWithdrawal } from '@/lib/invest/capital-withdrawal'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import {
  assertTransactionAuthorized,
  type TransactionStepUpCredentials,
} from '@/lib/security/transaction-protection'

export async function submitCapitalWithdrawalAction(
  input: {
    investmentId: string
    supportNote?: string
  } & TransactionStepUpCredentials
) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false as const, error: 'You must be signed in.' }
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'payout')
  if (!account.allowed) {
    return { success: false as const, error: account.error }
  }

  const auth = await assertTransactionAuthorized(user.id, 'payout', {
    totpCode: input.totpCode,
    transactionPin: input.transactionPin,
  })
  if (!auth.allowed) {
    return { success: false as const, error: auth.error }
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
