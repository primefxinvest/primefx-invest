export interface AdminDisplayRank {
  id: string
  name: string
  badge: string | null
  color: string
  icon: string
  description: string | null
  priority: number
  benefits: string[]
  admin_notes: string | null
  status: string
  is_custom: boolean
  created_at: string
  updated_at: string
}

export interface AdminInvestmentRow {
  id: string
  reference_id: string | null
  user_id: string
  user_email: string
  user_name: string | null
  user_avatar: string | null
  user_country: string | null
  investor_tier: string | null
  display_rank_name: string | null
  display_rank_color: string | null
  plan_name: string
  amount: number
  current_value: number
  accumulated_profit: number
  daily_profit: number
  roi_percentage: number
  status: string
  start_date: string
  created_at: string
  next_payout_at: string | null
  capital_withdrawal_unlock_at: string | null
  compound_mode: boolean
}

export interface AdminInvestmentStats {
  totalActive: number
  totalInvestedCapital: number
  totalOutstandingProfit: number
  todayProfit: number
  weeklyProfit: number
  monthlyProfit: number
  averageRoi: number
  highestInvestor: { name: string; email: string; amount: number } | null
  newestInvestor: { name: string; email: string; createdAt: string } | null
}

export interface AdminInvestmentAnalytics {
  investmentGrowth: Array<{ month: string; amount: number; count: number }>
  planDistribution: Array<{ name: string; value: number; amount: number }>
  profitDistribution: Array<{ range: string; count: number }>
  countryDistribution: Array<{ country: string; count: number }>
  rankDistribution: Array<{ rank: string; count: number }>
  dailyInvestments: Array<{ date: string; count: number; amount: number }>
}

export interface AdminInvestmentDetail {
  investment: AdminInvestmentRow
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    country: string | null
    phone_number: string | null
    kyc_status: string | null
    account_status: string | null
    investor_tier: string | null
    display_rank_name: string | null
    created_at: string
  }
  wallet: {
    available_balance: number
    total_balance: number
    pending_balance: number
    bonus_balance: number
  } | null
  profitHistory: Array<{
    id: string
    period_date: string
    amount_usd: number
    daily_rate: number
    principal_usd: number
    created_at: string
  }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    status: string
    description: string | null
    created_at: string
  }>
  withdrawalHistory: Array<{
    id: string
    amount_usd: number
    status: string
    requested_at: string
    available_at: string | null
  }>
  referralCommissions: Array<{
    id: string
    commission_usd: number
    level: number
    status: string
    period_start: string
    period_end: string
    created_at: string
  }>
  timeline: Array<{
    id: string
    label: string
    detail: string
    at: string
    kind: 'investment' | 'profit' | 'withdrawal' | 'transaction'
  }>
}

export interface AdminInvestmentActivityRow {
  id: string
  admin_email: string | null
  action: string
  target_user_id: string | null
  target_resource: string | null
  metadata: Record<string, unknown>
  created_at: string
}
