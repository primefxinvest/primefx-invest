import type { AdminModule, AdminTier } from './types'

export const ADMIN_TIER_LABELS: Record<AdminTier, string> = {
  1: 'Super Admin',
  2: 'Finance Admin',
  3: 'Support Admin',
  4: 'Compliance Admin',
  5: 'Content Admin',
}

const TIER_ROLE_KEYS: Record<AdminTier, string> = {
  1: 'super_admin',
  2: 'finance_admin',
  3: 'support_admin',
  4: 'compliance_admin',
  5: 'content_admin',
}

/** Permissions matrix from PrimeFx Admin System spec */
const PERMISSIONS_MATRIX: Record<AdminModule, Record<string, boolean>> = {
  user_management: {
    super_admin: true,
    finance_admin: false,
    support_admin: true,
    compliance_admin: true,
    content_admin: false,
  },
  financial_management: {
    super_admin: true,
    finance_admin: true,
    support_admin: false,
    compliance_admin: true,
    content_admin: false,
  },
  investment_plan_management: {
    super_admin: true,
    finance_admin: true,
    support_admin: false,
    compliance_admin: false,
    content_admin: true,
  },
  profit_and_payout_management: {
    super_admin: true,
    finance_admin: true,
    support_admin: false,
    compliance_admin: false,
    content_admin: false,
  },
  kyc_aml_compliance: {
    super_admin: true,
    finance_admin: false,
    support_admin: false,
    compliance_admin: true,
    content_admin: false,
  },
  notifications_communications: {
    super_admin: true,
    finance_admin: false,
    support_admin: true,
    compliance_admin: false,
    content_admin: true,
  },
  primeai_management: {
    super_admin: true,
    finance_admin: false,
    support_admin: true,
    compliance_admin: false,
    content_admin: true,
  },
  rewards_referral: {
    super_admin: true,
    finance_admin: true,
    support_admin: false,
    compliance_admin: false,
    content_admin: false,
  },
  analytics_reporting: {
    super_admin: true,
    finance_admin: true,
    support_admin: true,
    compliance_admin: true,
    content_admin: true,
  },
  market_content: {
    super_admin: true,
    finance_admin: false,
    support_admin: false,
    compliance_admin: false,
    content_admin: true,
  },
  security_risk: {
    super_admin: true,
    finance_admin: false,
    support_admin: false,
    compliance_admin: true,
    content_admin: false,
  },
  platform_configuration: {
    super_admin: true,
    finance_admin: false,
    support_admin: false,
    compliance_admin: false,
    content_admin: false,
  },
  support_tickets: {
    super_admin: true,
    finance_admin: false,
    support_admin: true,
    compliance_admin: false,
    content_admin: false,
  },
  audit_logs: {
    super_admin: true,
    finance_admin: false,
    support_admin: false,
    compliance_admin: true,
    content_admin: false,
  },
}

export function canAccessModule(tier: AdminTier, module: AdminModule): boolean {
  const roleKey = TIER_ROLE_KEYS[tier]
  return PERMISSIONS_MATRIX[module]?.[roleKey] ?? false
}

export function getAccessibleModules(tier: AdminTier): AdminModule[] {
  return (Object.keys(PERMISSIONS_MATRIX) as AdminModule[]).filter((module) =>
    canAccessModule(tier, module)
  )
}

export const ADMIN_NAV_ITEMS: Array<{
  href: string
  label: string
  module: AdminModule
  icon: string
}> = [
  { href: '/admin', label: 'Dashboard', module: 'analytics_reporting', icon: 'BarChart3' },
  { href: '/admin/users', label: 'User Management', module: 'user_management', icon: 'Users' },
  { href: '/admin/kyc', label: 'KYC Verification', module: 'kyc_aml_compliance', icon: 'FileText' },
  { href: '/admin/verifications', label: 'Didit Sessions', module: 'kyc_aml_compliance', icon: 'ShieldCheck' },
  { href: '/admin/plans', label: 'Investment Plans', module: 'investment_plan_management', icon: 'Zap' },
  { href: '/admin/wallets', label: 'Wallet Management', module: 'financial_management', icon: 'Wallet' },
  { href: '/admin/transactions', label: 'Transactions', module: 'financial_management', icon: 'TrendingUp' },
  { href: '/admin/rewards', label: 'Rewards', module: 'rewards_referral', icon: 'Award' },
  { href: '/admin/support', label: 'Support Tickets', module: 'support_tickets', icon: 'MessageCircle' },
  { href: '/admin/analytics', label: 'Analytics', module: 'analytics_reporting', icon: 'BarChart3' },
  { href: '/admin/compliance', label: 'Compliance', module: 'audit_logs', icon: 'Lock' },
  { href: '/admin/settings', label: 'Settings', module: 'platform_configuration', icon: 'Settings' },
]

export const DUAL_APPROVAL_THRESHOLD = 10_000
