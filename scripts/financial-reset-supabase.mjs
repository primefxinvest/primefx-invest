/**
 * Financial reset via Supabase service role (PostgREST).
 * Mirrors scripts/financial-reset.sql when DATABASE_URL is unavailable.
 */

const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000'
const SENTINEL_TEXT = '__financial_reset_none__'

const FINANCIAL_TABLES = [
  { table: 'investment_profit_history', column: 'id' },
  { table: 'investment_daily_snapshots', column: 'id' },
  { table: 'investment_payouts', column: 'id' },
  { table: 'investment_withdrawal_requests', column: 'id' },
  { table: 'payment_webhook_logs', column: 'id' },
  { table: 'payments', column: 'id' },
  { table: 'withdrawal_requests', column: 'id' },
  { table: 'transactions', column: 'id' },
  { table: 'investments', column: 'id' },
  { table: 'investment_profit_runs', column: 'id' },
  { table: 'referral_commissions', column: 'id' },
  { table: 'referral_rank_rewards', column: 'id' },
  { table: 'platform_fee_ledger', column: 'id' },
  { table: 'financial_audit_logs', column: 'id' },
  { table: 'user_reward_redemptions', column: 'id' },
]

const PREFLIGHT_TABLES = [
  'users',
  'referrals',
  'referral_network',
  'kyc_submissions',
  'verification_sessions',
  'admin_profiles',
  'support_tickets',
]

const FINANCIAL_NOTIFICATION_TYPES = ['wallet', 'investment', 'payout', 'reward']

async function countTable(db, table) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    if (error.message.includes('schema cache') || error.code === 'PGRST205') {
      return 0
    }
    throw new Error(`count ${table}: ${error.message}`)
  }
  return count ?? 0
}

async function deleteAllRows(db, table, column = 'id') {
  const filter =
    column === 'job_name'
      ? db.from(table).delete({ count: 'exact' }).neq(column, SENTINEL_TEXT)
      : db.from(table).delete({ count: 'exact' }).neq(column, SENTINEL_UUID)

  const { count, error } = await filter
  if (error) {
    if (error.message.includes('schema cache') || error.code === 'PGRST205') {
      return 0
    }
    throw new Error(`delete ${table}: ${error.message}`)
  }
  return count ?? 0
}

export async function snapshotPreflight(db) {
  const counts = {}
  for (const table of PREFLIGHT_TABLES) {
    counts[table] = await countTable(db, table)
  }
  return counts
}

export async function assertPreflightPreserved(db, before) {
  for (const table of PREFLIGHT_TABLES) {
    const after = await countTable(db, table)
    if (after !== before[table]) {
      throw new Error(`Preserved entity changed: ${table} (${before[table]} → ${after})`)
    }
  }
}

export async function executeFinancialResetSupabase(db) {
  const preflight = await snapshotPreflight(db)
  const deleted = {}

  await deleteAllRows(db, 'cron_job_locks', 'job_name')

  for (const { table, column } of FINANCIAL_TABLES) {
    deleted[table] = await deleteAllRows(db, table, column)
  }

  const now = new Date().toISOString()

  const { error: walletError } = await db
    .from('wallet_balances')
    .update({
      available_balance: 0,
      pending_balance: 0,
      bonus_balance: 0,
      total_balance: 0,
      updated_at: now,
    })
    .neq('user_id', SENTINEL_UUID)
  if (walletError) throw new Error(`update wallet_balances: ${walletError.message}`)

  const { error: portfolioError } = await db
    .from('portfolios')
    .update({
      total_invested: 0,
      current_value: 0,
      profit_loss: 0,
      roi_percentage: 0,
      updated_at: now,
    })
    .neq('user_id', SENTINEL_UUID)
  if (portfolioError) throw new Error(`update portfolios: ${portfolioError.message}`)

  const { error: referralsError } = await db
    .from('referrals')
    .update({
      bonus_earned: 0,
      welcome_bonus_paid: false,
      status: 'Active',
    })
    .neq('id', SENTINEL_UUID)
  if (referralsError) throw new Error(`update referrals: ${referralsError.message}`)

  const { error: statsError } = await db
    .from('user_referral_stats')
    .update({
      lifetime_commission_usd: 0,
      updated_at: now,
    })
    .neq('user_id', SENTINEL_UUID)
  if (statsError) throw new Error(`update user_referral_stats: ${statsError.message}`)

  const { error: plansError } = await db
    .from('investment_plans')
    .update({ investor_count: 0 })
    .neq('id', SENTINEL_UUID)
  if (plansError) throw new Error(`update investment_plans: ${plansError.message}`)

  for (const type of FINANCIAL_NOTIFICATION_TYPES) {
    const { error } = await db.from('user_notifications').delete().eq('type', type)
    if (error) throw new Error(`delete user_notifications type=${type}: ${error.message}`)
  }

  const { data: users, error: usersError } = await db.from('users').select('id')
  if (usersError) throw new Error(`fetch users: ${usersError.message}`)

  const { data: wallets, error: walletsFetchError } = await db.from('wallet_balances').select('user_id')
  if (walletsFetchError) throw new Error(`fetch wallet_balances: ${walletsFetchError.message}`)

  const { data: portfolios, error: portfoliosFetchError } = await db.from('portfolios').select('user_id')
  if (portfoliosFetchError) throw new Error(`fetch portfolios: ${portfoliosFetchError.message}`)

  const walletUserIds = new Set((wallets ?? []).map((row) => row.user_id))
  const portfolioUserIds = new Set((portfolios ?? []).map((row) => row.user_id))

  const missingWallets = (users ?? [])
    .filter((row) => !walletUserIds.has(row.id))
    .map((row) => ({
      user_id: row.id,
      available_balance: 0,
      pending_balance: 0,
      bonus_balance: 0,
      total_balance: 0,
    }))

  const missingPortfolios = (users ?? [])
    .filter((row) => !portfolioUserIds.has(row.id))
    .map((row) => ({
      user_id: row.id,
      total_invested: 0,
      current_value: 0,
      profit_loss: 0,
      roi_percentage: 0,
    }))

  if (missingWallets.length > 0) {
    const { error } = await db.from('wallet_balances').insert(missingWallets)
    if (error) throw new Error(`insert wallet_balances: ${error.message}`)
  }

  if (missingPortfolios.length > 0) {
    const { error } = await db.from('portfolios').insert(missingPortfolios)
    if (error) throw new Error(`insert portfolios: ${error.message}`)
  }

  await verifyFinancialZero(db)
  await assertPreflightPreserved(db, preflight)

  return { preflight, deleted, missingWallets: missingWallets.length, missingPortfolios: missingPortfolios.length }
}

export async function verifyFinancialZero(db) {
  const checks = {
    transactions: await countTable(db, 'transactions'),
    payments: await countTable(db, 'payments'),
    withdrawal_requests: await countTable(db, 'withdrawal_requests'),
    investments: await countTable(db, 'investments'),
    profit_history: await countTable(db, 'investment_profit_history'),
    referral_commissions: await countTable(db, 'referral_commissions'),
    rank_rewards: await countTable(db, 'referral_rank_rewards'),
    reward_redemptions: await countTable(db, 'user_reward_redemptions'),
    financial_audit_logs: await countTable(db, 'financial_audit_logs'),
  }

  for (const [key, value] of Object.entries(checks)) {
    if (value !== 0) {
      throw new Error(`Verify failed: ${key} count = ${value} (expected 0)`)
    }
  }

  const { data: walletRows, error: walletError } = await db
    .from('wallet_balances')
    .select('total_balance, pending_balance, bonus_balance')
  if (walletError) throw new Error(`verify wallet_balances: ${walletError.message}`)

  const walletSums = (walletRows ?? []).reduce(
    (acc, row) => ({
      total: acc.total + Number(row.total_balance ?? 0),
      pending: acc.pending + Number(row.pending_balance ?? 0),
      bonus: acc.bonus + Number(row.bonus_balance ?? 0),
    }),
    { total: 0, pending: 0, bonus: 0 }
  )

  if (walletSums.total !== 0 || walletSums.pending !== 0 || walletSums.bonus !== 0) {
    throw new Error(
      `Verify failed: wallet sums total=${walletSums.total}, pending=${walletSums.pending}, bonus=${walletSums.bonus}`
    )
  }

  const { data: portfolioRows, error: portfolioError } = await db
    .from('portfolios')
    .select('total_invested, current_value, profit_loss')
  if (portfolioError) throw new Error(`verify portfolios: ${portfolioError.message}`)

  const portfolioSums = (portfolioRows ?? []).reduce(
    (acc, row) => ({
      invested: acc.invested + Number(row.total_invested ?? 0),
      value: acc.value + Number(row.current_value ?? 0),
      profit: acc.profit + Number(row.profit_loss ?? 0),
    }),
    { invested: 0, value: 0, profit: 0 }
  )

  if (portfolioSums.invested !== 0 || portfolioSums.value !== 0 || portfolioSums.profit !== 0) {
    throw new Error(
      `Verify failed: portfolio sums invested=${portfolioSums.invested}, value=${portfolioSums.value}, profit=${portfolioSums.profit}`
    )
  }

  const { count: referralsWithBonus, error: bonusError } = await db
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .gt('bonus_earned', 0)
  if (bonusError) throw new Error(`verify referrals bonus: ${bonusError.message}`)
  if ((referralsWithBonus ?? 0) > 0) {
    throw new Error(`Verify failed: referrals with bonus_earned > 0 (${referralsWithBonus})`)
  }

  const { count: statsWithCommission, error: commissionError } = await db
    .from('user_referral_stats')
    .select('*', { count: 'exact', head: true })
    .gt('lifetime_commission_usd', 0)
  if (commissionError) throw new Error(`verify referral stats: ${commissionError.message}`)
  if ((statsWithCommission ?? 0) > 0) {
    throw new Error(`Verify failed: user_referral_stats with commission > 0 (${statsWithCommission})`)
  }

  return { checks, walletSums, portfolioSums }
}

export async function collectVerificationReport(db) {
  const checks = {
    transactions: await countTable(db, 'transactions'),
    payments: await countTable(db, 'payments'),
    withdrawal_requests: await countTable(db, 'withdrawal_requests'),
    investments: await countTable(db, 'investments'),
    profit_history: await countTable(db, 'investment_profit_history'),
    referral_commissions: await countTable(db, 'referral_commissions'),
    rank_rewards: await countTable(db, 'referral_rank_rewards'),
    reward_redemptions: await countTable(db, 'user_reward_redemptions'),
    financial_audit_logs: await countTable(db, 'financial_audit_logs'),
  }

  const { data: walletRows } = await db.from('wallet_balances').select('total_balance, pending_balance, bonus_balance')
  const walletSums = (walletRows ?? []).reduce(
    (acc, row) => ({
      total_balance_sum: acc.total_balance_sum + Number(row.total_balance ?? 0),
      pending_balance_sum: acc.pending_balance_sum + Number(row.pending_balance ?? 0),
      bonus_balance_sum: acc.bonus_balance_sum + Number(row.bonus_balance ?? 0),
    }),
    { total_balance_sum: 0, pending_balance_sum: 0, bonus_balance_sum: 0 }
  )

  const { data: portfolioRows } = await db.from('portfolios').select('total_invested, current_value, profit_loss')
  const portfolioSums = (portfolioRows ?? []).reduce(
    (acc, row) => ({
      invested_sum: acc.invested_sum + Number(row.total_invested ?? 0),
      value_sum: acc.value_sum + Number(row.current_value ?? 0),
      profit_sum: acc.profit_sum + Number(row.profit_loss ?? 0),
    }),
    { invested_sum: 0, value_sum: 0, profit_sum: 0 }
  )

  const preserved = await snapshotPreflight(db)

  return {
    financial_counts: checks,
    wallet_totals: walletSums,
    portfolio_totals: portfolioSums,
    preserved_users: preserved,
  }
}
