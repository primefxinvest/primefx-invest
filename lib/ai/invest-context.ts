import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getPrimeAIInvestContext(): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('investment_plans')
      .select('name, weekly_roi, risk_level, minimum_investment, max_investment, duration, payout_frequency, description')
      .eq('is_active', true)
      .eq('visibility', 'public')
      .order('minimum_investment', { ascending: true })

    if (error || !data?.length) {
      return 'No live investment plans are loaded from the database right now. Describe general investing principles only.'
    }

    const lines = data.map((plan) => {
      const min = Number(plan.minimum_investment ?? 0)
      const max = plan.max_investment != null ? Number(plan.max_investment) : null
      const maxLabel = max != null ? `, max $${max.toLocaleString()}` : ''
      return `- ${plan.name}: ${Number(plan.weekly_roi ?? 0)}% weekly ROI, ${plan.risk_level ?? 'medium'} risk, min $${min.toLocaleString()}${maxLabel}, ${plan.duration ?? 'flexible'}, payouts ${plan.payout_frequency ?? 'weekly'}${plan.description ? ` — ${plan.description}` : ''}`
    })

    return `Use ONLY these PrimeFx investment plans when recommending products on this platform (do not invent other plans):\n${lines.join('\n')}`
  } catch {
    return 'Investment plan data is temporarily unavailable.'
  }
}
