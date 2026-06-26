import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type {
  AdminAuditLogRow,
  AdminDashboardMetrics,
  AdminPlanRow,
  AdminTransactionRow,
  AdminUserRow,
  AdminWalletRow,
} from './types'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error(
      'Admin data access requires SUPABASE_SERVICE_ROLE_KEY. Add it to your environment variables.'
    )
  }
  return db
}

function normalizeKycStatus(status: string | null) {
  if (!status) return 'Pending'
  const lower = status.toLowerCase()
  if (lower === 'verified') return 'Verified'
  if (lower === 'rejected') return 'Rejected'
  return 'Pending'
}

function mapUser(row: Record<string, unknown>): AdminUserRow {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    full_name: (row.full_name as string) ?? null,
    investor_tier: (row.investor_tier as string) ?? 'Starter',
    kyc_status: normalizeKycStatus((row.kyc_status as string) ?? null),
    kyc_level: (row.kyc_level as string) ?? 'basic',
    account_status: (row.account_status as string) ?? 'active',
    country: (row.country as string) ?? null,
    created_at: String(row.created_at ?? ''),
    admin_notes: (row.admin_notes as string) ?? null,
  }
}

export async function getAdminUsers(search?: string): Promise<AdminUserRow[]> {
  const db = getDb()
  let query = db.from('users').select('*').order('created_at', { ascending: false }).limit(200)

  if (search?.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`email.ilike.${term},full_name.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapUser)
}

export async function getAdminKycQueue(): Promise<AdminUserRow[]> {
  const users = await getAdminUsers()
  return users.filter((u) => u.kyc_status === 'Pending')
}

export async function getAdminWallets(): Promise<AdminWalletRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('wallet_balances')
    .select('*, users!inner(id, email, full_name)')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const user = row.users as Record<string, unknown>
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      user_email: String(user?.email ?? ''),
      user_name: (user?.full_name as string) ?? null,
      available_balance: Number(row.available_balance ?? 0),
      pending_balance: Number(row.pending_balance ?? 0),
      bonus_balance: Number(row.bonus_balance ?? 0),
      total_balance: Number(row.total_balance ?? 0),
      updated_at: String(row.updated_at ?? ''),
    }
  })
}

export async function getAdminTransactions(): Promise<AdminTransactionRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('transactions')
    .select('*, users!inner(id, email, full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const user = row.users as Record<string, unknown>
    return {
      id: String(row.id),
      user_id: String(row.user_id),
      user_email: String(user?.email ?? ''),
      user_name: (user?.full_name as string) ?? null,
      type: String(row.type ?? ''),
      amount: Number(row.amount ?? 0),
      status: String(row.status ?? 'Pending'),
      description: (row.description as string) ?? null,
      reference_id: (row.reference_id as string) ?? null,
      created_at: String(row.created_at ?? ''),
    }
  })
}

export async function getAdminPlans(): Promise<AdminPlanRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('investment_plans')
    .select('*')
    .order('minimum_investment', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    weekly_roi: Number(row.weekly_roi ?? 0),
    risk_level: String(row.risk_level ?? ''),
    minimum_investment: Number(row.minimum_investment ?? 0),
    max_investment: row.max_investment != null ? Number(row.max_investment) : null,
    duration: (row.duration as string) ?? null,
    payout_frequency: (row.payout_frequency as string) ?? null,
    description: (row.description as string) ?? null,
    investor_count: row.investor_count != null ? Number(row.investor_count) : 0,
    is_active: row.is_active != null ? Boolean(row.is_active) : true,
    visibility: (row.visibility as string) ?? 'public',
    max_investors: row.max_investors != null ? Number(row.max_investors) : null,
    created_at: String(row.created_at ?? ''),
  }))
}

export async function getAdminRewardsTiers() {
  const db = getDb()
  const { data, error } = await db
    .from('rewards_tiers')
    .select('*')
    .order('minimum_points', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdminAuditLogs(limit = 50): Promise<AdminAuditLogRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('admin_audit_logs')
    .select('*, admin:admin_id(email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const admin = row.admin as Record<string, unknown> | null
    return {
      id: String(row.id),
      admin_id: String(row.admin_id),
      admin_tier: row.admin_tier != null ? Number(row.admin_tier) : null,
      module: String(row.module ?? ''),
      action: String(row.action ?? ''),
      target_user_id: (row.target_user_id as string) ?? null,
      target_resource: (row.target_resource as string) ?? null,
      before_state: (row.before_state as Record<string, unknown>) ?? null,
      after_state: (row.after_state as Record<string, unknown>) ?? null,
      reason_code: (row.reason_code as string) ?? null,
      created_at: String(row.created_at ?? ''),
      admin_email: (admin?.email as string) ?? null,
    }
  })
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const db = getDb()

  const [
    usersRes,
    investmentsRes,
    walletsRes,
    pendingKycRes,
    pendingWithdrawalsRes,
    depositsRes,
    withdrawalsRes,
    recentTxRes,
    auditRes,
  ] = await Promise.all([
    db.from('users').select('id', { count: 'exact', head: true }),
    db.from('investments').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    db.from('wallet_balances').select('total_balance'),
    db.from('users').select('id', { count: 'exact', head: true }).or('kyc_status.eq.Pending,kyc_status.eq.pending'),
    db
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'withdrawal')
      .eq('status', 'Pending'),
    db.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'Completed'),
    db.from('transactions').select('amount').eq('type', 'withdrawal').eq('status', 'Completed'),
    db
      .from('transactions')
      .select('*, users!inner(id, email, full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
    db
      .from('admin_audit_logs')
      .select('*, admin:admin_id(email)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const totalAum = (walletsRes.data ?? []).reduce(
    (sum, row) => sum + Number((row as { total_balance?: number }).total_balance ?? 0),
    0
  )

  const totalDeposits = (depositsRes.data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount?: number }).amount ?? 0),
    0
  )

  const totalWithdrawals = (withdrawalsRes.data ?? []).reduce(
    (sum, row) => sum + Number((row as { amount?: number }).amount ?? 0),
    0
  )

  const recentTransactions: AdminTransactionRow[] = (recentTxRes.data ?? []).map(
    (row: Record<string, unknown>) => {
      const user = row.users as Record<string, unknown>
      return {
        id: String(row.id),
        user_id: String(row.user_id),
        user_email: String(user?.email ?? ''),
        user_name: (user?.full_name as string) ?? null,
        type: String(row.type ?? ''),
        amount: Number(row.amount ?? 0),
        status: String(row.status ?? 'Pending'),
        description: (row.description as string) ?? null,
        reference_id: (row.reference_id as string) ?? null,
        created_at: String(row.created_at ?? ''),
      }
    }
  )

  const recentAuditLogs: AdminAuditLogRow[] = (auditRes.data ?? []).map(
    (row: Record<string, unknown>) => {
      const admin = row.admin as Record<string, unknown> | null
      return {
        id: String(row.id),
        admin_id: String(row.admin_id),
        admin_tier: row.admin_tier != null ? Number(row.admin_tier) : null,
        module: String(row.module ?? ''),
        action: String(row.action ?? ''),
        target_user_id: (row.target_user_id as string) ?? null,
        target_resource: (row.target_resource as string) ?? null,
        before_state: (row.before_state as Record<string, unknown>) ?? null,
        after_state: (row.after_state as Record<string, unknown>) ?? null,
        reason_code: (row.reason_code as string) ?? null,
        created_at: String(row.created_at ?? ''),
        admin_email: (admin?.email as string) ?? null,
      }
    }
  )

  return {
    totalUsers: usersRes.count ?? 0,
    activeInvestors: investmentsRes.count ?? 0,
    totalAum,
    pendingKyc: pendingKycRes.count ?? 0,
    pendingWithdrawals: pendingWithdrawalsRes.count ?? 0,
    totalDeposits,
    totalWithdrawals,
    recentTransactions,
    recentAuditLogs,
  }
}

export async function getAdminAnalytics() {
  const db = getDb()
  const [users, plans, investments, transactions] = await Promise.all([
    db.from('users').select('id, country, investor_tier, created_at'),
    db.from('investment_plans').select('id, name, investor_count, weekly_roi'),
    db.from('investments').select('plan_id, amount, status'),
    db.from('transactions').select('type, amount, status, created_at'),
  ])

  const planDistribution = (plans.data ?? []).map((plan) => ({
    name: String((plan as { name: string }).name),
    investors: Number((plan as { investor_count?: number }).investor_count ?? 0),
    weeklyRoi: Number((plan as { weekly_roi?: number }).weekly_roi ?? 0),
  }))

  const tierDistribution = (users.data ?? []).reduce<Record<string, number>>((acc, user) => {
    const tier = String((user as { investor_tier?: string }).investor_tier ?? 'Starter')
    acc[tier] = (acc[tier] ?? 0) + 1
    return acc
  }, {})

  const countryDistribution = (users.data ?? []).reduce<Record<string, number>>((acc, user) => {
    const country = String((user as { country?: string }).country ?? 'Unknown')
    acc[country] = (acc[country] ?? 0) + 1
    return acc
  }, {})

  const completedDeposits = (transactions.data ?? [])
    .filter(
      (tx) =>
        String((tx as { type: string }).type).toLowerCase() === 'deposit' &&
        String((tx as { status: string }).status).toLowerCase() === 'completed'
    )
    .reduce((sum, tx) => sum + Number((tx as { amount: number }).amount ?? 0), 0)

  const completedWithdrawals = (transactions.data ?? [])
    .filter(
      (tx) =>
        String((tx as { type: string }).type).toLowerCase() === 'withdrawal' &&
        String((tx as { status: string }).status).toLowerCase() === 'completed'
    )
    .reduce((sum, tx) => sum + Number((tx as { amount: number }).amount ?? 0), 0)

  return {
    totalUsers: users.data?.length ?? 0,
    totalInvestments: investments.data?.length ?? 0,
    planDistribution,
    tierDistribution,
    countryDistribution,
    completedDeposits,
    completedWithdrawals,
    netRevenue: completedDeposits - completedWithdrawals,
  }
}
