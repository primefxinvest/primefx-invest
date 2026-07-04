import { canAccessFeature, normalizeInvestorTier } from '@/lib/investor/tiers'
import type { InvestorTierKey } from '@/lib/investor/types'

export function isAdvancedCourse(difficulty?: string | null) {
  return (difficulty ?? '').toLowerCase() === 'advanced'
}

export function canAccessAdvancedCourse(tier?: string | null) {
  return canAccessFeature(normalizeInvestorTier(tier), 'portfolio_analysis')
}

export function courseAccessDeniedReason(
  difficulty: string,
  tier?: string | null
): string | null {
  if (!isAdvancedCourse(difficulty)) return null
  if (canAccessAdvancedCourse(tier)) return null
  return 'Prime Investor tier required for advanced courses'
}

export function requiredTierForCourse(difficulty: string): InvestorTierKey | null {
  return isAdvancedCourse(difficulty) ? 'prime' : null
}
