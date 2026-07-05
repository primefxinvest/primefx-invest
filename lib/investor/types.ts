export type InvestorTierKey = 'starter' | 'growth' | 'prime' | 'elite'

export type InvestorModule =
  | 'account_management'
  | 'dashboard'
  | 'investment_operations'
  | 'wallet_operations'
  | 'portfolio_management'
  | 'transaction_history'
  | 'primeai_assistant'
  | 'referral_and_rewards'
  | 'market_insights'
  | 'academy'
  | 'notifications'
  | 'support'
  | 'community'

export type InvestorFeature =
  | 'basic_dashboard'
  | 'full_dashboard'
  | 'advanced_dashboard'
  | 'premium_dashboard'
  | 'daily_payouts'
  | 'standard_support'
  | 'priority_support'
  | 'dedicated_support'
  | 'vip_support'
  | 'basic_primeai_access'
  | 'enhanced_primeai_access'
  | 'full_primeai_access'
  | 'unlimited_primeai_access'
  | 'academy_access'
  | 'market_insights'
  | 'referral_program'
  | 'portfolio_analysis'
  | 'advanced_portfolio_analysis'
  | 'early_plan_access'
  | 'exclusive_plans'
  | 'personal_account_manager'
  | 'custom_investment_strategies'

export interface InvestorTierConfig {
  key: InvestorTierKey
  label: string
  minimumInvestment: number
  weeklyReturn: string
  category: string
  badge: string
  features: InvestorFeature[]
}

export interface InvestorContext {
  userId: string
  tierKey: InvestorTierKey
  tierLabel: string
  badge: string
  config: InvestorTierConfig
}
