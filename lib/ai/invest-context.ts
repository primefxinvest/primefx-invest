import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PLAN_UI_META } from '@/lib/invest/plan-mapper'

export async function getPrimeAIInvestContext(): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('investment_plans')
      .select('name, weekly_roi, minimum_investment, max_investment, duration, description')
      .eq('is_active', true)
      .eq('visibility', 'public')
      .order('minimum_investment', { ascending: true })

    if (error || !data?.length) {
      return 'No live investment plans are loaded from the database right now. Describe general investing principles only.'
    }

    const lines = data.map((plan) => {
      const meta = PLAN_UI_META[plan.name]
      const weeklyReturn = meta?.displayWeeklyRoi ?? `${Number(plan.weekly_roi ?? 0)}%`
      const category = meta?.badge ?? 'Investment Plan'
      const targetInvestor = meta?.targetInvestor ?? 'All Investors'
      const min = Number(plan.minimum_investment ?? 0)
      const max = plan.max_investment != null ? Number(plan.max_investment) : null
      const maxLabel = max != null ? `, max $${max.toLocaleString()}` : ''
      return `- ${plan.name}: ${weeklyReturn} weekly return, ${category}, for ${targetInvestor}, min $${min.toLocaleString()}${maxLabel}, ${plan.duration ?? 'flexible'}, weekly payout${plan.description ? ` — ${plan.description}` : ''}`
    })

    return `Use ONLY these PrimeFx investment plans when recommending products on this platform (do not invent other plans):\n${lines.join('\n')}`
  } catch {
    return 'Investment plan data is temporarily unavailable.'
  }
}
