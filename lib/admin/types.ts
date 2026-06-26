export type AdminTier = 1 | 2 | 3 | 4 | 5

export type AdminModule =
  | 'user_management'
  | 'financial_management'
  | 'investment_plan_management'
  | 'profit_and_payout_management'
  | 'kyc_aml_compliance'
  | 'notifications_communications'
  | 'primeai_management'
  | 'rewards_referral'
  | 'analytics_reporting'
  | 'market_content'
  | 'security_risk'
  | 'platform_configuration'
  | 'support_tickets'
  | 'audit_logs'

export interface AdminProfile {
  id: string
  user_id: string
  tier: AdminTier
  role_label: string
  is_active: boolean
  created_at: string
}

export interface AdminContext {
  userId: string
  email: string
  tier: AdminTier
  roleLabel: string
  isBootstrap: boolean
}

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  investor_tier: string | null
  kyc_status: string | null
  kyc_level: string | null
  account_status: string | null
  country: string | null
  created_at: string
  admin_notes: string | null
}

export interface AdminWalletRow {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  available_balance: number
  pending_balance: number
  bonus_balance: number
  total_balance: number
  updated_at: string
}

export interface AdminTransactionRow {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  type: string
  amount: number
  status: string
  description: string | null
  reference_id: string | null
  created_at: string
}

export interface AdminPlanRow {
  id: string
  name: string
  weekly_roi: number
  risk_level: string
  minimum_investment: number
  max_investment: number | null
  duration: string | null
  payout_frequency: string | null
  description: string | null
  investor_count: number | null
  is_active: boolean | null
  visibility: string | null
  max_investors: number | null
  created_at: string
}

export interface AdminAuditLogRow {
  id: string
  admin_id: string
  admin_tier: number | null
  module: string
  action: string
  target_user_id: string | null
  target_resource: string | null
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  reason_code: string | null
  created_at: string
  admin_email?: string | null
}

export interface AdminDashboardMetrics {
  totalUsers: number
  activeInvestors: number
  totalAum: number
  pendingKyc: number
  pendingWithdrawals: number
  totalDeposits: number
  totalWithdrawals: number
  recentTransactions: AdminTransactionRow[]
  recentAuditLogs: AdminAuditLogRow[]
}

export type AccountStatus = 'active' | 'suspended' | 'banned'
export type KycStatus = 'Pending' | 'Verified' | 'Rejected' | 'pending' | 'verified' | 'rejected'
