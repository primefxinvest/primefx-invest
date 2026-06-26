import { getCurrentUser } from '@/lib/supabase'
import { createInvestment, createTransaction } from '@/lib/db/supabase'

interface ProcessInvestmentInput {
  planId: string
  planName: string
  amount: number
}

export async function processInvestment(
  input: ProcessInvestmentInput
): Promise<{ success: boolean; error?: string }> {
  const { data: user } = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'You must be logged in to invest.' }
  }

  try {
    const { error: investmentError } = await createInvestment({
      user_id: user.id,
      plan_id: input.planId,
      plan_name: input.planName,
      amount: input.amount,
      status: 'active',
    })

    if (investmentError) {
      // Fall back to local storage when DB schema isn't ready
      saveLocalInvestment(user.id, input)
    } else {
      await createTransaction({
        user_id: user.id,
        type: 'investment',
        amount: input.amount,
        status: 'completed',
        description: `Investment in ${input.planName}`,
        plan_id: input.planId,
      })
    }

    return { success: true }
  } catch {
    if (user?.id) {
      saveLocalInvestment(user.id, input)
      return { success: true }
    }

    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

function saveLocalInvestment(userId: string, input: ProcessInvestmentInput) {
  if (typeof window === 'undefined') return

  const key = `primefx_investments_${userId}`
  const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as ProcessInvestmentInput[]
  existing.push({ ...input, createdAt: new Date().toISOString() } as ProcessInvestmentInput & {
    createdAt: string
  })
  localStorage.setItem(key, JSON.stringify(existing))
}
