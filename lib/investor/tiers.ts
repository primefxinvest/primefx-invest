import type { InvestorFeature, InvestorTierConfig, InvestorTierKey } from './types'

export type { InvestorFeature, InvestorTierConfig, InvestorTierKey } from './types'

export const INVESTOR_TIER_ORDER: InvestorTierKey[] = ['starter', 'growth', 'prime', 'elite']

export const INVESTOR_TIERS: Record<InvestorTierKey, InvestorTierConfig> = {
  starter: {
    key: 'starter',
    label: 'Starter Investor',
    minimumInvestment: 50,
    roiRange: '8% - 15%',
    riskLevel: 'Low',
    badge: '🌱',
    features: [
      'basic_dashboard',
      'weekly_payouts',
      'standard_support',
      'basic_primeai_access',
      'academy_access',
    ],
  },
  growth: {
    key: 'growth',
    label: 'Growth Investor',
    minimumInvestment: 200,
    roiRange: '15% - 25%',
    riskLevel: 'Medium',
    badge: '📈',
    features: [
      'full_dashboard',
      'weekly_payouts',
      'priority_support',
      'enhanced_primeai_access',
      'academy_access',
      'market_insights',
    ],
  },
  prime: {
    key: 'prime',
    label: 'Prime Investor',
    minimumInvestment: 500,
    roiRange: '25% - 40%',
    riskLevel: 'High',
    badge: '💎',
    features: [
      'advanced_dashboard',
      'weekly_payouts',
      'dedicated_support',
      'full_primeai_access',
      'academy_access',
      'market_insights',
      'portfolio_analysis',
      'early_plan_access',
    ],
  },
  elite: {
    key: 'elite',
    label: 'Elite Investor',
    minimumInvestment: 1000,
    roiRange: '40% - 60%',
    riskLevel: 'Very High',
    badge: '👑',
    features: [
      'premium_dashboard',
      'weekly_payouts',
      'vip_support',
      'unlimited_primeai_access',
      'academy_access',
      'market_insights',
      'advanced_portfolio_analysis',
      'early_plan_access',
      'exclusive_plans',
      'personal_account_manager',
      'custom_investment_strategies',
    ],
  },
}

export function normalizeInvestorTier(tier?: string | null): InvestorTierKey {
  const value = (tier ?? 'starter').toLowerCase()
  if (value.includes('elite')) return 'elite'
  if (value.includes('prime')) return 'prime'
  if (value.includes('growth')) return 'growth'
  if (value.includes('starter')) return 'starter'
  return 'starter'
}

export function getInvestorTierConfig(tier?: string | null): InvestorTierConfig {
  return INVESTOR_TIERS[normalizeInvestorTier(tier)]
}

export function formatInvestorTierLabel(tier?: string | null): string {
  return getInvestorTierConfig(tier).label
}

export function tierMeetsMinimum(
  userTier: InvestorTierKey,
  requiredTier: InvestorTierKey
): boolean {
  return INVESTOR_TIER_ORDER.indexOf(userTier) >= INVESTOR_TIER_ORDER.indexOf(requiredTier)
}

export function getNextTier(current: InvestorTierKey): InvestorTierKey | null {
  const index = INVESTOR_TIER_ORDER.indexOf(current)
  if (index < 0 || index >= INVESTOR_TIER_ORDER.length - 1) return null
  return INVESTOR_TIER_ORDER[index + 1]
}

export function hasInvestorFeature(
  tier: InvestorTierKey | string | null | undefined,
  feature: InvestorFeature
): boolean {
  const config = getInvestorTierConfig(tier ?? 'starter')
  return config.features.includes(feature)
}

/** Minimum tier required for gated platform routes */
export const ROUTE_MIN_TIER: Partial<Record<string, InvestorTierKey>> = {
  '/market-insights': 'growth',
}

export function getRouteRequiredTier(path: string): InvestorTierKey | undefined {
  return ROUTE_MIN_TIER[path]
}

/** Features that unlock at each tier (for upgrade prompts) */
export const FEATURE_MIN_TIER: Partial<Record<InvestorFeature, InvestorTierKey>> = {
  market_insights: 'growth',
  portfolio_analysis: 'prime',
  advanced_portfolio_analysis: 'elite',
  early_plan_access: 'prime',
  exclusive_plans: 'elite',
  full_primeai_access: 'prime',
  unlimited_primeai_access: 'elite',
}

export function canAccessRoute(
  tier: InvestorTierKey | string | null | undefined,
  path: string
): boolean {
  const required = ROUTE_MIN_TIER[path]
  if (!required) return true
  return tierMeetsMinimum(normalizeInvestorTier(tier), required)
}

export function canAccessFeature(
  tier: InvestorTierKey | string | null | undefined,
  feature: InvestorFeature
): boolean {
  const required = FEATURE_MIN_TIER[feature]
  if (!required) return hasInvestorFeature(tier, feature)
  return tierMeetsMinimum(normalizeInvestorTier(tier), required)
}
