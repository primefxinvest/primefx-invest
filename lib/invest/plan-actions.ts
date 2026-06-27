'use server'

import { fetchPublicInvestmentPlans } from '@/lib/invest/public-plans'
import type { InvestmentPlan } from '@/lib/data/types'

export async function loadInvestmentPlans(): Promise<InvestmentPlan[]> {
  return fetchPublicInvestmentPlans()
}
