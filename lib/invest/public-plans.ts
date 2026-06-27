import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mapDbPlansToInvestmentPlans } from '@/lib/invest/plan-mapper'
import type { InvestmentPlan } from '@/lib/data/types'

export async function fetchPublicInvestmentPlans(): Promise<InvestmentPlan[]> {
  try {
    const supabase = await createServerSupabaseClient()

    let { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .eq('visibility', 'public')
      .order('minimum_investment', { ascending: true })

    if (error) {
      const fallback = await supabase
        .from('investment_plans')
        .select('*')
        .order('minimum_investment', { ascending: true })

      data = fallback.data
      error = fallback.error
    }

    if (error || !data?.length) {
      return []
    }

    return mapDbPlansToInvestmentPlans(data)
  } catch {
    return []
  }
}
