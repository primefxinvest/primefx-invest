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

export interface AdminKycQueueRow {
  submission_id: string
  user_id: string
  email: string
  full_name: string | null
  id_type: string
  id_number: string
  country: string
  review_status: string
  kyc_status: string | null
  submitted_at: string | null
}

export interface AdminKycSubmissionDetail {
  id: string
  id_type: string
  id_number: string
  country: string
  review_status: string
  submitted_at: string | null
  reviewed_at: string | null
  document_urls: {
    documentFront: string | null
    documentBack: string | null
    selfie: string | null
    proofOfAddress: string | null
  }
}

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  investor_tier: string | null
  kyc_status: string | null
  kyc_level: string | null
  account_status: string | null
  country: string | null
  created_at: string
  admin_notes: string | null
  mfa_disabled_at?: string | null
  mfa_disabled_reason?: string | null
  referral_access_enabled?: boolean | null
}

export interface AdminUserDetailProfile extends AdminUserRow {
  phone_number: string | null
  avatar_url: string | null
  kyc_rejection_reason: string | null
  suspended_at: string | null
  suspended_reason: string | null
  updated_at: string | null
  date_of_birth: string | null
  address: string | null
  email_verified: boolean
  last_sign_in_at: string | null
  referral_access_enabled: boolean
}

export interface AdminUserInvestmentRow {
  id: string
  plan_name: string
  amount: number
  current_value: number
  roi_percentage: number
  status: string
  start_date: string
  end_date: string | null
}

export interface AdminUserReferralRow {
  id: string
  referred_email: string
  referred_name: string | null
  bonus_earned: number
  status: string
  created_at: string
}

export interface AdminUserActivityRow {
  id: string
  action: string
  device: string | null
  created_at: string
}

export interface AdminUserPaymentMethodRow {
  id: string
  method_type: string
  last_four: string | null
  is_primary: boolean
  created_at: string
}

export interface AdminUserDetail {
  profile: AdminUserDetailProfile
  mfa: { bypassed: boolean; factorCount: number }
  wallet: {
    available_balance: number
    pending_balance: number
    bonus_balance: number
    total_balance: number
    updated_at: string
  } | null
  portfolio: {
    total_invested: number
    current_value: number
    profit_loss: number
    roi_percentage: number
    updated_at: string
  } | null
  investments: AdminUserInvestmentRow[]
  transactions: AdminTransactionRow[]
  referrals: {
    total: number
    total_bonus: number
    items: AdminUserReferralRow[]
  }
  activity: AdminUserActivityRow[]
  payment_methods: AdminUserPaymentMethodRow[]
  kyc_submission: AdminKycSubmissionDetail | null
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
  pendingDeposits: number
  totalDeposits: number
  totalWithdrawals: number
  netFlow: number
  monthlyVolume: Array<{ month: string; deposits: number; withdrawals: number }>
  tierDistribution: Record<string, number>
  transactionBreakdown: { pending: number; completed: number; failed: number }
  recentTransactions: AdminTransactionRow[]
  recentAuditLogs: AdminAuditLogRow[]
}

export type AccountStatus = 'active' | 'suspended' | 'banned'
export type KycStatus = 'Pending' | 'Verified' | 'Rejected' | 'pending' | 'verified' | 'rejected'

export interface AdminVerificationSessionRow {
  id: string
  session_id: string
  vendor_data: string | null
  status: string
  decision: Record<string, unknown> | null
  workflow_id: string | null
  user_id: string | null
  user_email: string | null
  user_name: string | null
  created_at: string
  updated_at: string
}

export interface AdminVerificationSessionsResult {
  rows: AdminVerificationSessionRow[]
  total: number
  page: number
  pageSize: number
  stats: {
    total: number
    approved: number
    declined: number
    inReview: number
    pending: number
  }
}

export interface AdminSupportTicketRow {
  id: string
  shortId: string
  userId: string
  userEmail: string
  userName: string | null
  subject: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  replyCount: number
  lastReplyAt: string | null
  lastReplyBy: 'user' | 'admin' | null
}

export interface AdminSupportTicketMessage {
  id: string
  senderType: 'user' | 'admin'
  senderId: string
  senderName: string
  message: string
  createdAt: string
}

export interface AdminSupportTicketDetail {
  id: string
  shortId: string
  userId: string
  userEmail: string
  userName: string | null
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  messages: AdminSupportTicketMessage[]
}
