import type { InvestmentPlan } from '@/lib/data/types'

export const planTierOrder = [
  { key: 'starter', shortName: 'Starter', planName: 'Starter Plan' },
  { key: 'growth', shortName: 'Growth', planName: 'Growth Plan' },
  { key: 'prime', shortName: 'Prime', planName: 'Prime Plan' },
  { key: 'elite', shortName: 'Elite', planName: 'Elite Plan' },
] as const

export type PlanTierKey = (typeof planTierOrder)[number]['key']

export function normalizePlanTier(tier?: string | null): PlanTierKey {
  const value = (tier ?? 'starter').toLowerCase()

  if (value.includes('elite')) return 'elite'
  if (value.includes('prime')) return 'prime'
  if (value.includes('growth')) return 'growth'
  if (value.includes('starter')) return 'starter'

  return 'starter'
}

export interface UpgradeOffer {
  currentTier: PlanTierKey
  currentPlanName: string
  nextPlanId: string
  nextPlanName: string
  nextTierLabel: string
  weeklyRoi: string
  description: string
}

export function getUpgradeOffer(
  tier?: string | null,
  plans: InvestmentPlan[] = []
): UpgradeOffer | null {
  const currentTier = normalizePlanTier(tier)
  const currentIndex = planTierOrder.findIndex((plan) => plan.key === currentTier)

  if (currentIndex === -1 || currentIndex >= planTierOrder.length - 1) {
    return null
  }

  const nextTier = planTierOrder[currentIndex + 1]
  const nextPlan = plans.find((plan) => plan.name === nextTier.planName)
  const currentPlan = plans.find((plan) => plan.name === planTierOrder[currentIndex].planName)

  if (!nextPlan) return null

  return {
    currentTier,
    currentPlanName: currentPlan?.name ?? planTierOrder[currentIndex].shortName,
    nextPlanId: nextPlan.id,
    nextPlanName: nextPlan.name,
    nextTierLabel: nextTier.shortName,
    weeklyRoi: nextPlan.weeklyRoi,
    description: `Unlock ${nextPlan.name} benefits and up to ${nextPlan.weeklyRoi} weekly returns`,
  }
}
