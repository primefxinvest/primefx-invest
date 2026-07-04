import 'server-only'

import { mapDbTransactionToAdminRow } from '@/lib/data/transaction-map'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type {
  AdminAuditLogRow,
  AdminDashboardMetrics,
  AdminKycQueueRow,
  AdminPlanRow,
  AdminTransactionRow,
  AdminUserDetail,
  AdminUserRow,
  AdminVerificationSessionRow,
  AdminVerificationSessionsResult,
  AdminWalletRow,
  AdminSupportTicketRow,
  AdminSupportTicketDetail,
} from './types'
import { getAdminUserMfaSummary } from '@/lib/auth/mfa-admin'
import { signKycDocumentPaths } from '@/lib/kyc/storage'

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
    avatar_url: (row.avatar_url as string) ?? null,
    investor_tier: (row.investor_tier as string) ?? 'Starter',
    kyc_status: normalizeKycStatus((row.kyc_status as string) ?? null),
    kyc_level: (row.kyc_level as string) ?? 'basic',
    account_status: (row.account_status as string) ?? 'active',
    country: (row.country as string) ?? null,
    created_at: String(row.created_at ?? ''),
    admin_notes: (row.admin_notes as string) ?? null,
    mfa_disabled_at: (row.mfa_disabled_at as string) ?? null,
    mfa_disabled_reason: (row.mfa_disabled_reason as string) ?? null,
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

function unwrapJoinedUser(users: unknown): Record<string, unknown> | null {
  if (!users) return null
  if (Array.isArray(users)) return (users[0] as Record<string, unknown> | undefined) ?? null
  return users as Record<string, unknown>
}

export async function getAdminKycQueue(): Promise<AdminKycQueueRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('kyc_submissions')
    .select(
      `
      id,
      user_id,
      id_type,
      id_number,
      country,
      review_status,
      submitted_at,
      users ( email, full_name, kyc_status )
    `
    )
    .eq('review_status', 'submitted')
    .order('submitted_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const user = unwrapJoinedUser(row.users)
    return {
      submission_id: String(row.id),
      user_id: String(row.user_id),
      email: String(user?.email ?? '—'),
      full_name: (user?.full_name as string) ?? null,
      id_type: String(row.id_type),
      id_number: String(row.id_number),
      country: String(row.country),
      review_status: String(row.review_status),
      kyc_status: (user?.kyc_status as string) ?? null,
      submitted_at: (row.submitted_at as string) ?? null,
    }
  })
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const db = getDb()

  const { data: userRow, error: userError } = await db
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (userError) throw new Error(userError.message)
  if (!userRow) return null

  const { data: authData } = await db.auth.admin.getUserById(userId).catch(() => ({
    data: { user: null },
  }))
  const authUser = authData.user
  const metadata = authUser?.user_metadata ?? {}

  const base = mapUser(userRow as Record<string, unknown>)
  const profile = {
    ...base,
    phone_number:
      (userRow.phone_number as string | null) ??
      (metadata.phone as string | undefined) ??
      null,
    avatar_url: (userRow.avatar_url as string | null) ?? (metadata.avatar_url as string | undefined) ?? null,
    kyc_rejection_reason: (userRow.kyc_rejection_reason as string | null) ?? null,
    suspended_at: (userRow.suspended_at as string | null) ?? null,
    suspended_reason: (userRow.suspended_reason as string | null) ?? null,
    updated_at: (userRow.updated_at as string | null) ?? null,
    date_of_birth: (metadata.date_of_birth as string | undefined) ?? null,
    address: (metadata.address as string | undefined) ?? null,
    email_verified: Boolean(authUser?.email_confirmed_at),
    last_sign_in_at: authUser?.last_sign_in_at ?? null,
    referral_access_enabled: Boolean(userRow.referral_access_enabled),
  }

  const [
    walletRes,
    portfolioRes,
    investmentsRes,
    transactionsRes,
    referralsRes,
    activityRes,
    paymentMethodsRes,
    mfaSummary,
    kycRes,
  ] = await Promise.all([
    db.from('wallet_balances').select('*').eq('user_id', userId).maybeSingle(),
    db.from('portfolios').select('*').eq('user_id', userId).maybeSingle(),
    db
      .from('investments')
      .select('*, investment_plans(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25),
    db
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15),
    db
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    getAdminUserMfaSummary([userId]),
    db.from('kyc_submissions').select('*').eq('user_id', userId).maybeSingle(),
  ])

  if (walletRes.error) throw new Error(walletRes.error.message)
  if (portfolioRes.error) throw new Error(portfolioRes.error.message)
  if (investmentsRes.error) throw new Error(investmentsRes.error.message)
  if (transactionsRes.error) throw new Error(transactionsRes.error.message)
  if (referralsRes.error && !referralsRes.error.message.includes('schema cache')) {
    throw new Error(referralsRes.error.message)
  }
  if (activityRes.error && !activityRes.error.message.includes('schema cache')) {
    throw new Error(activityRes.error.message)
  }
  if (paymentMethodsRes.error && !paymentMethodsRes.error.message.includes('schema cache')) {
    throw new Error(paymentMethodsRes.error.message)
  }
  if (kycRes.error && !kycRes.error.message.includes('schema cache')) {
    throw new Error(kycRes.error.message)
  }

  const kycRow = kycRes.data
  const kycSubmission = kycRow
    ? {
        id: String(kycRow.id),
        id_type: String(kycRow.id_type),
        id_number: String(kycRow.id_number),
        country: String(kycRow.country),
        review_status: String(kycRow.review_status),
        submitted_at: (kycRow.submitted_at as string) ?? null,
        reviewed_at: (kycRow.reviewed_at as string) ?? null,
        document_urls: await signKycDocumentPaths({
          documentFront: (kycRow.document_front_path as string) ?? null,
          documentBack: (kycRow.document_back_path as string) ?? null,
          selfie: (kycRow.selfie_path as string) ?? null,
          proofOfAddress: (kycRow.proof_of_address_path as string) ?? null,
        }),
      }
    : null

  const walletRow = walletRes.data
  const portfolioRow = portfolioRes.data

  const referralRows = referralsRes.data ?? []
  const referredIds = referralRows
    .map((row) => row.referred_user_id as string | undefined)
    .filter(Boolean) as string[]

  const referredUsersRes =
    referredIds.length > 0
      ? await db.from('users').select('id, email, full_name').in('id', referredIds)
      : { data: [] as Record<string, unknown>[] }

  const referredById = new Map(
    (referredUsersRes.data ?? []).map((row) => [String(row.id), row])
  )

  const referralItems = referralRows.map((row: Record<string, unknown>) => {
    const referred = referredById.get(String(row.referred_user_id))
    return {
      id: String(row.id),
      referred_email: String(referred?.email ?? '—'),
      referred_name: (referred?.full_name as string) ?? null,
      bonus_earned: Number(row.bonus_earned ?? 0),
      status: String(row.status ?? 'Active'),
      created_at: String(row.created_at ?? ''),
    }
  })

  return {
    profile,
    mfa: mfaSummary[userId] ?? { bypassed: Boolean(profile.mfa_disabled_at), factorCount: 0 },
    wallet: walletRow
      ? {
          available_balance: Number(walletRow.available_balance ?? 0),
          pending_balance: Number(walletRow.pending_balance ?? 0),
          bonus_balance: Number(walletRow.bonus_balance ?? 0),
          total_balance: Number(walletRow.total_balance ?? 0),
          updated_at: String(walletRow.updated_at ?? ''),
        }
      : null,
    portfolio: portfolioRow
      ? {
          total_invested: Number(portfolioRow.total_invested ?? 0),
          current_value: Number(portfolioRow.current_value ?? 0),
          profit_loss: Number(portfolioRow.profit_loss ?? 0),
          roi_percentage: Number(portfolioRow.roi_percentage ?? 0),
          updated_at: String(portfolioRow.updated_at ?? ''),
        }
      : null,
    investments: (investmentsRes.data ?? []).map((row: Record<string, unknown>) => {
      const plan = row.investment_plans as Record<string, unknown> | null
      return {
        id: String(row.id),
        plan_name: String(plan?.name ?? 'Unknown plan'),
        amount: Number(row.amount ?? 0),
        current_value: Number(row.current_value ?? 0),
        roi_percentage: Number(row.roi_percentage ?? 0),
        status: String(row.status ?? 'Active'),
        start_date: String(row.start_date ?? row.created_at ?? ''),
        end_date: (row.end_date as string) ?? null,
      }
    }),
    transactions: (transactionsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      user_id: userId,
      user_email: profile.email,
      user_name: profile.full_name,
      type: String(row.type ?? ''),
      amount: Number(row.amount ?? 0),
      status: String(row.status ?? 'Pending'),
      description: (row.description as string) ?? null,
      reference_id: (row.reference_id as string) ?? null,
      created_at: String(row.created_at ?? ''),
    })),
    referrals: {
      total: referralItems.length,
      total_bonus: referralItems.reduce((sum, item) => sum + item.bonus_earned, 0),
      items: referralItems,
    },
    activity: (activityRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      action: String(row.action ?? ''),
      device: (row.device as string) ?? null,
      created_at: String(row.created_at ?? ''),
    })),
    payment_methods: (paymentMethodsRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      method_type: String(row.method_type ?? ''),
      last_four: (row.last_four as string) ?? null,
      is_primary: Boolean(row.is_primary),
      created_at: String(row.created_at ?? ''),
    })),
    kyc_submission: kycSubmission,
  }
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

  return (data ?? []).map((row: Record<string, unknown>) => mapDbTransactionToAdminRow(row))
}

export async function getAdminTransactionById(
  transactionId: string
): Promise<AdminTransactionRow | null> {
  const db = getDb()
  const { data, error } = await db
    .from('transactions')
    .select('*, users!inner(id, email, full_name)')
    .eq('id', transactionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return mapDbTransactionToAdminRow(data as Record<string, unknown>)
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

  if (error) {
    if (error.message.includes('rewards_tiers') && error.message.includes('schema cache')) {
      throw new Error(
        'Table public.rewards_tiers is missing. Run supabase/migrations/006_rewards_tiers.sql in the Supabase SQL Editor.'
      )
    }
    throw new Error(error.message)
  }
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
    tierUsersRes,
    investmentsRes,
    walletsRes,
    pendingKycRes,
    pendingWithdrawalsRes,
    pendingDepositsRes,
    depositsRes,
    withdrawalsRes,
    txVolumeRes,
    pendingTxRes,
    completedTxRes,
    failedTxRes,
    recentTxRes,
    auditRes,
  ] = await Promise.all([
    db.from('users').select('id', { count: 'exact', head: true }),
    db.from('users').select('investor_tier'),
    db.from('investments').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    db.from('wallet_balances').select('total_balance'),
    db.from('users').select('id', { count: 'exact', head: true }).or('kyc_status.eq.Pending,kyc_status.eq.pending'),
    db
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'withdrawal')
      .eq('status', 'Pending'),
    db
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'deposit')
      .eq('status', 'Pending'),
    db.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'Completed'),
    db.from('transactions').select('amount').eq('type', 'withdrawal').eq('status', 'Completed'),
    db.from('transactions').select('type, amount, status, created_at'),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'Completed'),
    db
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.Failed,status.eq.Rejected,status.eq.Cancelled'),
    db
      .from('transactions')
      .select('*, users!inner(id, email, full_name)')
      .order('created_at', { ascending: false })
      .limit(12),
    db
      .from('admin_audit_logs')
      .select('*, admin:admin_id(email)')
      .order('created_at', { ascending: false })
      .limit(8),
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

  const tierDistribution = (tierUsersRes.data ?? []).reduce<Record<string, number>>((acc, user) => {
    const tier = String((user as { investor_tier?: string }).investor_tier ?? 'Starter')
    acc[tier] = (acc[tier] ?? 0) + 1
    return acc
  }, {})

  const monthlyVolume = buildMonthlyVolume(txVolumeRes.data ?? [])

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
    pendingDeposits: pendingDepositsRes.count ?? 0,
    totalDeposits,
    totalWithdrawals,
    netFlow: totalDeposits - totalWithdrawals,
    monthlyVolume,
    tierDistribution,
    transactionBreakdown: {
      pending: pendingTxRes.count ?? 0,
      completed: completedTxRes.count ?? 0,
      failed: failedTxRes.count ?? 0,
    },
    recentTransactions,
    recentAuditLogs,
  }
}

export async function getAdminAnalytics() {
  const db = getDb()
  const [users, plans, investments, transactions] = await Promise.all([
    db.from('users').select('id, country, investor_tier, created_at, kyc_status'),
    db.from('investment_plans').select('id, name, investor_count, weekly_roi, is_active'),
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
    activeInvestments:
      investments.data?.filter((row) => String((row as { status?: string }).status) === 'Active')
        .length ?? 0,
    planDistribution,
    tierDistribution,
    countryDistribution,
    completedDeposits,
    completedWithdrawals,
    netRevenue: completedDeposits - completedWithdrawals,
    pendingDeposits:
      transactions.data?.filter(
        (tx) =>
          String((tx as { type: string }).type).toLowerCase() === 'deposit' &&
          String((tx as { status: string }).status).toLowerCase() === 'pending'
      ).length ?? 0,
    pendingWithdrawals:
      transactions.data?.filter(
        (tx) =>
          String((tx as { type: string }).type).toLowerCase() === 'withdrawal' &&
          String((tx as { status: string }).status).toLowerCase() === 'pending'
      ).length ?? 0,
    kycPending:
      users.data?.filter((user) => {
        const kyc = String((user as { kyc_status?: string }).kyc_status ?? 'pending').toLowerCase()
        return kyc === 'pending'
      }).length ?? 0,
    monthlyVolume: buildMonthlyVolume(transactions.data ?? []),
    activePlans: plans.data?.filter((plan) => (plan as { is_active?: boolean }).is_active !== false)
      .length ?? 0,
  }
}

function buildMonthlyVolume(transactions: Record<string, unknown>[]) {
  const buckets = new Map<string, { deposits: number; withdrawals: number }>()

  for (const tx of transactions) {
    const createdAt = String((tx as { created_at?: string }).created_at ?? '')
    if (!createdAt) continue
    const month = createdAt.slice(0, 7)
    const type = String((tx as { type: string }).type).toLowerCase()
    const status = String((tx as { status: string }).status).toLowerCase()
    if (status !== 'completed') continue

    const entry = buckets.get(month) ?? { deposits: 0, withdrawals: 0 }
    const amount = Number((tx as { amount: number }).amount ?? 0)
    if (type === 'deposit') entry.deposits += amount
    if (type === 'withdrawal') entry.withdrawals += amount
    buckets.set(month, entry)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, values]) => ({
      month,
      deposits: values.deposits,
      withdrawals: values.withdrawals,
    }))
}

const VERIFICATION_PAGE_SIZE = 20

function mapVerificationSessionRow(
  row: Record<string, unknown>,
  usersById: Map<string, { email: string; full_name: string | null }>
): AdminVerificationSessionRow {
  const userId = (row.user_id as string | null) ?? null
  const user = userId ? usersById.get(userId) : undefined

  return {
    id: String(row.id),
    session_id: String(row.session_id),
    vendor_data: (row.vendor_data as string | null) ?? null,
    status: String(row.status ?? 'Not Started'),
    decision: (row.decision as Record<string, unknown> | null) ?? null,
    workflow_id: (row.workflow_id as string | null) ?? null,
    user_id: userId,
    user_email: user?.email ?? null,
    user_name: user?.full_name ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getAdminVerificationSessions(input: {
  page?: number
  pageSize?: number
  status?: string
  search?: string
}): Promise<AdminVerificationSessionsResult> {
  const db = getDb()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = input.pageSize ?? VERIFICATION_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const status = input.status?.trim()
  const search = input.search?.trim()

  let query = db.from('verification_sessions').select('*', { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const escaped = search.replace(/[%_,]/g, '')
    const term = `%${escaped}%`
    query = query.or(`session_id.ilike.${term},vendor_data.ilike.${term}`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  const userIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.user_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  const usersById = new Map<string, { email: string; full_name: string | null }>()
  if (userIds.length > 0) {
    const { data: users } = await db
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)

    users?.forEach((user) => {
      usersById.set(user.id as string, {
        email: String(user.email ?? ''),
        full_name: (user.full_name as string | null) ?? null,
      })
    })
  }

  const { data: allStatuses, error: statsError } = await db
    .from('verification_sessions')
    .select('status')

  if (statsError) {
    throw new Error(statsError.message)
  }

  const stats = {
    total: allStatuses?.length ?? 0,
    approved: 0,
    declined: 0,
    inReview: 0,
    pending: 0,
  }

  for (const row of allStatuses ?? []) {
    const value = String(row.status ?? '')
    if (value === 'Approved') stats.approved += 1
    else if (value === 'Declined') stats.declined += 1
    else if (value === 'In Review') stats.inReview += 1
    else if (value === 'Not Started' || value === 'In Progress') stats.pending += 1
  }

  return {
    rows: (data ?? []).map((row) =>
      mapVerificationSessionRow(row as Record<string, unknown>, usersById)
    ),
    total: count ?? 0,
    page,
    pageSize,
    stats,
  }
}

export type AdminWithdrawalQueueRow = {
  id: string
  kind: 'wallet' | 'capital'
  user_id: string
  user_email: string
  amount_usd: number
  status: string
  requested_at: string
  available_at: string
  reference_id: string | null
}

export async function getAdminWithdrawalQueue(): Promise<AdminWithdrawalQueueRow[]> {
  const db = getDb()
  const [{ data: walletRows }, { data: capitalRows }, { data: users }] = await Promise.all([
    db.from('withdrawal_requests').select('*').order('requested_at', { ascending: false }).limit(100),
    db.from('investment_withdrawal_requests').select('*').order('requested_at', { ascending: false }).limit(100),
    db.from('users').select('id, email'),
  ])

  const emailById = new Map((users ?? []).map((u) => [String(u.id), String(u.email ?? '')]))

  const wallet = (walletRows ?? []).map((row) => ({
    id: String(row.id),
    kind: 'wallet' as const,
    user_id: String(row.user_id),
    user_email: emailById.get(String(row.user_id)) ?? '—',
    amount_usd: Number(row.amount_usd ?? 0),
    status: String(row.status ?? 'pending'),
    requested_at: String(row.requested_at ?? ''),
    available_at: String(row.available_at ?? ''),
    reference_id: (row.reference_id as string) ?? null,
  }))

  const capital = (capitalRows ?? []).map((row) => ({
    id: String(row.id),
    kind: 'capital' as const,
    user_id: String(row.user_id),
    user_email: emailById.get(String(row.user_id)) ?? '—',
    amount_usd: Number(row.amount_usd ?? 0),
    status: String(row.status ?? 'pending'),
    requested_at: String(row.requested_at ?? ''),
    available_at: String(row.available_at ?? ''),
    reference_id: (row.reference_id as string) ?? null,
  }))

  return [...wallet, ...capital].sort(
    (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
  )
}

export type AdminRankRewardRow = {
  id: string
  user_id: string
  user_email: string
  rank_key: string
  cash_bonus_usd: number
  perks: string[]
  status: string
  paid_at: string | null
  fulfilled_at: string | null
  admin_notes: string | null
}

export async function getAdminReferralRankRewards(): Promise<AdminRankRewardRow[]> {
  const db = getDb()
  const { data: rewards, error } = await db
    .from('referral_rank_rewards')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  const userIds = [...new Set((rewards ?? []).map((r) => String(r.user_id)))]
  const { data: users } = userIds.length
    ? await db.from('users').select('id, email').in('id', userIds)
    : { data: [] }

  const emailById = new Map((users ?? []).map((u) => [String(u.id), String(u.email ?? '')]))

  return (rewards ?? []).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    user_email: emailById.get(String(row.user_id)) ?? '—',
    rank_key: String(row.rank_key),
    cash_bonus_usd: Number(row.cash_bonus_usd ?? 0),
    perks: Array.isArray(row.perks) ? (row.perks as string[]) : [],
    status: String(row.status ?? 'pending'),
    paid_at: (row.paid_at as string) ?? null,
    fulfilled_at: (row.fulfilled_at as string) ?? null,
    admin_notes: (row.admin_notes as string) ?? null,
  }))
}

function shortTicketId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function displayUserName(email: string, fullName: string | null | undefined) {
  return fullName?.trim() || email.split('@')[0] || 'User'
}

export async function getAdminSupportTickets(): Promise<AdminSupportTicketRow[]> {
  const db = getDb()
  const { data: tickets, error } = await db
    .from('support_tickets')
    .select('*, users(email, full_name)')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)
  if (!tickets?.length) return []

  const ticketIds = tickets.map((row) => String(row.id))
  const { data: messages } = await db
    .from('support_ticket_messages')
    .select('ticket_id, sender_type, created_at')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: false })

  const statsByTicket = new Map<
    string,
    { count: number; lastReplyAt: string | null; lastReplyBy: 'user' | 'admin' | null }
  >()

  for (const ticketId of ticketIds) {
    statsByTicket.set(ticketId, { count: 0, lastReplyAt: null, lastReplyBy: null })
  }

  for (const row of messages ?? []) {
    const ticketId = String(row.ticket_id)
    const current = statsByTicket.get(ticketId)
    if (!current) continue
    current.count += 1
    if (!current.lastReplyAt) {
      current.lastReplyAt = String(row.created_at)
      current.lastReplyBy = row.sender_type as 'user' | 'admin'
    }
  }

  return tickets.map((row) => {
    const user = row.users as { email?: string; full_name?: string | null } | null
    const id = String(row.id)
    const stats = statsByTicket.get(id) ?? { count: 0, lastReplyAt: null, lastReplyBy: null }

    return {
      id,
      shortId: shortTicketId(id),
      userId: String(row.user_id),
      userEmail: String(user?.email ?? '—'),
      userName: user?.full_name ?? null,
      subject: String(row.subject),
      status: String(row.status ?? 'open'),
      priority: String(row.priority ?? 'medium'),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      replyCount: stats.count,
      lastReplyAt: stats.lastReplyAt,
      lastReplyBy: stats.lastReplyBy,
    }
  })
}

export async function getAdminSupportTicketDetail(
  ticketId: string
): Promise<AdminSupportTicketDetail | null> {
  const db = getDb()
  const { data: ticket, error } = await db
    .from('support_tickets')
    .select('*, users(email, full_name)')
    .eq('id', ticketId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!ticket) return null

  const { data: messageRows } = await db
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  const senderIds = [
    ...new Set([
      String(ticket.user_id),
      ...(messageRows ?? []).map((row) => String(row.sender_id)),
    ]),
  ]

  const { data: senders } = await db
    .from('users')
    .select('id, email, full_name')
    .in('id', senderIds)

  const senderById = new Map(
    (senders ?? []).map((row) => [
      String(row.id),
      {
        email: String(row.email ?? ''),
        fullName: (row.full_name as string | null) ?? null,
      },
    ])
  )

  const user = ticket.users as { email?: string; full_name?: string | null } | null
  const id = String(ticket.id)

  const messages = (messageRows ?? []).map((row) => {
    const sender = senderById.get(String(row.sender_id))
    const senderType = row.sender_type as 'user' | 'admin'
    return {
      id: String(row.id),
      senderType,
      senderId: String(row.sender_id),
      senderName:
        senderType === 'admin'
          ? 'Support Team'
          : displayUserName(sender?.email ?? '', sender?.fullName),
      message: String(row.message),
      createdAt: String(row.created_at),
    }
  })

  return {
    id,
    shortId: shortTicketId(id),
    userId: String(ticket.user_id),
    userEmail: String(user?.email ?? '—'),
    userName: user?.full_name ?? null,
    subject: String(ticket.subject),
    description: String(ticket.description),
    status: String(ticket.status ?? 'open'),
    priority: String(ticket.priority ?? 'medium'),
    createdAt: String(ticket.created_at),
    updatedAt: String(ticket.updated_at),
    messages,
  }
}
