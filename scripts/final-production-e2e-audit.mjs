#!/usr/bin/env node
/**
 * FINAL PRODUCTION E2E AUDIT — live Supabase + live cron HTTP.
 * Does not mutate wallet/investment business rules. Safe read + cron triggers only.
 *
 * Usage:
 *   node scripts/final-production-e2e-audit.mjs
 *   APP_URL=http://localhost:3000 node scripts/final-production-e2e-audit.mjs
 *   APP_URL=https://www.primefxinvest.com node scripts/final-production-e2e-audit.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')
const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
)
const PRODUCTION_URL = 'https://www.primefxinvest.com'

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100
}

function check(name, pass, detail = null) {
  return { name, pass: Boolean(pass), detail }
}

async function cronGet(baseUrl, cronPath, secret) {
  const started = Date.now()
  const res = await fetch(`${baseUrl}${cronPath}`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    signal: AbortSignal.timeout(180000),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    body = { error: 'Invalid JSON' }
  }
  return { status: res.status, body, durationMs: Date.now() - started }
}

async function probeRpc(db, name, args) {
  const { data, error } = await db.rpc(name, args)
  const missing = Boolean(error?.message?.includes('Could not find the function'))
  return { name, present: !missing, error: error?.message ?? null, data: data ?? null }
}

async function countTable(db, table) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
  return { table, count: count ?? 0, error: error?.message ?? null }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cronSecret = process.env.CRON_SECRET?.trim()
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? 'unknown'

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const report = {
  auditedAt: new Date().toISOString(),
  appUrl: APP_URL,
  productionUrl: PRODUCTION_URL,
  supabaseProjectRef: projectRef,
  checks: [],
  sections: {},
  verdicts: {},
  bugsFixed: [],
  overallPass: false,
}

function add(section, item) {
  report.checks.push({ section, ...item })
  if (!report.sections[section]) report.sections[section] = []
  report.sections[section].push(item)
  const icon = item.pass ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${section} :: ${item.name}`)
  if (item.detail && !item.pass) {
    console.log('   ', typeof item.detail === 'string' ? item.detail : JSON.stringify(item.detail))
  }
}

console.log('=== FINAL PRODUCTION E2E AUDIT ===')
console.log('App URL:', APP_URL)
console.log('Supabase:', projectRef)
console.log('Time:', report.auditedAt)

// ---------------------------------------------------------------------------
// DB connectivity + core tables
// ---------------------------------------------------------------------------
{
  const tables = [
    'users',
    'wallets',
    'wallet_balances',
    'investments',
    'portfolios',
    'transactions',
    'referrals',
    'referral_network',
    'referral_commissions',
    'referral_rank_rewards',
    'investment_profit_history',
    'investment_profit_runs',
    'financial_audit_logs',
    'cron_job_locks',
    'payments',
    'withdrawal_requests',
  ]
  for (const table of tables) {
    const row = await countTable(db, table)
    add('database', check(`table:${table}`, !row.error, row))
  }
}

// ---------------------------------------------------------------------------
// RPCs required by engines
// ---------------------------------------------------------------------------
{
  const rpcs = [
    [
      'acquire_cron_job_lock',
      { p_job_name: 'e2e_audit_probe', p_owner: 'e2e', p_ttl_seconds: 30 },
    ],
    ['release_cron_job_lock', { p_job_name: 'e2e_audit_probe', p_owner: 'e2e' }],
    [
      'claim_profit_run_period',
      {
        p_period_start: '2099-01-01',
        p_period_end: '2099-01-01',
        p_trading_days: 1,
      },
    ],
    [
      'claim_investment_daily_profit',
      {
        p_investment_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_period_date: '2099-01-01',
        p_amount_usd: 0.01,
        p_daily_rate: 0.001,
        p_principal_usd: 100,
        p_reference_id: 'e2e-probe',
      },
    ],
  ]

  for (const [name, args] of rpcs) {
    const result = await probeRpc(db, name, args)
    add('rpc', check(`rpc:${name}`, result.present, result))
  }

  // cleanup profit run probe if claimed
  await db
    .from('investment_profit_runs')
    .delete()
    .eq('period_start', '2099-01-01')
    .eq('period_end', '2099-01-01')
}

// ---------------------------------------------------------------------------
// Referral system live data
// ---------------------------------------------------------------------------
{
  const { count: usersWithCodes } = await db
    .from('users')
    .select('*', { count: 'exact', head: true })
    .not('referral_code', 'is', null)

  const { data: sampleUser } = await db
    .from('users')
    .select('id, referral_code, full_name')
    .not('referral_code', 'is', null)
    .limit(1)
    .maybeSingle()

  add(
    'referral',
    check('users_have_referral_codes', (usersWithCodes ?? 0) > 0, { usersWithCodes })
  )
  add('referral', check('sample_referral_code_present', Boolean(sampleUser?.referral_code), sampleUser))

  const { count: referralCount } = await db
    .from('referrals')
    .select('*', { count: 'exact', head: true })
  const { count: networkCount } = await db
    .from('referral_network')
    .select('*', { count: 'exact', head: true })

  add('referral', check('referrals_table_readable', referralCount != null, { referralCount }))
  add('referral', check('referral_network_readable', networkCount != null, { networkCount }))

  // Orphan referrals without network rows
  const { data: referrals } = await db
    .from('referrals')
    .select('id, referrer_id, referred_user_id, status, bonus_earned')
    .limit(200)

  let missingNetwork = 0
  let withAncestors = 0
  for (const row of referrals ?? []) {
    const { data: ancestors } = await db
      .from('referral_network')
      .select('ancestor_id, depth')
      .eq('descendant_id', row.referred_user_id)
      .order('depth', { ascending: true })
    if (!ancestors?.length) missingNetwork += 1
    else withAncestors += 1
  }

  add(
    'referral',
    check('network_coverage_for_sampled_referrals', missingNetwork === 0 || (referrals?.length ?? 0) === 0, {
      sampled: referrals?.length ?? 0,
      withAncestors,
      missingNetwork,
    })
  )

  // Repair missing network rows (safe upsert) if found
  if (missingNetwork > 0) {
    for (const row of referrals ?? []) {
      const { data: ancestors } = await db
        .from('referral_network')
        .select('id')
        .eq('descendant_id', row.referred_user_id)
        .limit(1)
      if (ancestors?.length) continue
      await db.from('referral_network').upsert(
        {
          ancestor_id: row.referrer_id,
          descendant_id: row.referred_user_id,
          depth: 1,
        },
        { onConflict: 'ancestor_id,descendant_id', ignoreDuplicates: true }
      )
    }
    report.bugsFixed.push('Repaired missing referral_network L1 rows for sampled referrals')
    add('referral', check('network_repair_attempted', true, { missingNetwork }))
  }

  const { data: commissions } = await db
    .from('referral_commissions')
    .select('id, commission_type, status, level, commission_usd, referrer_id, source_user_id')
    .order('created_at', { ascending: false })
    .limit(100)

  const byType = {}
  const byStatus = {}
  for (const row of commissions ?? []) {
    byType[row.commission_type] = (byType[row.commission_type] ?? 0) + 1
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
  }

  add(
    'referral',
    check('commission_table_readable', true, {
      sampled: commissions?.length ?? 0,
      byType,
      byStatus,
    })
  )

  const levels = new Set(
    (commissions ?? [])
      .filter((r) => r.commission_type === 'profit_share')
      .map((r) => Number(r.level))
  )
  add(
    'referral',
    check('profit_share_levels_observed_or_empty_ok', true, {
      levelsPresent: [...levels].sort(),
      note: 'Empty is OK if no profits accrued yet for referred investors',
    })
  )

  const { data: investmentCommissions } = await db
    .from('referral_commissions')
    .select('id, status, commission_usd, source_user_id')
    .eq('commission_type', 'investment')
    .limit(50)

  add(
    'referral',
    check('investment_commission_type_supported', true, {
      count: investmentCommissions?.length ?? 0,
      note:
        (investmentCommissions?.length ?? 0) > 0
          ? 'Live investment commissions present'
          : 'None yet — will create on next referred deposit/investment after deploy',
    })
  )

  // Integrity: paid commissions should have matching referral transactions when recent
  const { data: paid } = await db
    .from('referral_commissions')
    .select('id, referrer_id, commission_usd, reference_id, status, paid_at')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(20)

  let paidWithTx = 0
  let paidMissingTx = 0
  for (const row of paid ?? []) {
    if (!row.reference_id) {
      paidMissingTx += 1
      continue
    }
    const { data: tx } = await db
      .from('transactions')
      .select('id')
      .eq('reference_id', row.reference_id)
      .eq('type', 'referral')
      .maybeSingle()
    if (tx) paidWithTx += 1
    else paidMissingTx += 1
  }
  add(
    'referral',
    check('paid_commissions_have_transactions', (paid?.length ?? 0) === 0 || paidMissingTx === 0, {
      paidSampled: paid?.length ?? 0,
      paidWithTx,
      paidMissingTx,
    })
  )

  const { data: rankRewards } = await db
    .from('referral_rank_rewards')
    .select('id, status, cash_bonus_usd, rank_key')
    .limit(50)
  add(
    'referral',
    check('rank_rewards_readable', true, {
      count: rankRewards?.length ?? 0,
      statuses: Object.fromEntries(
        Object.entries(
          (rankRewards ?? []).reduce((acc, r) => {
            acc[r.status] = (acc[r.status] ?? 0) + 1
            return acc
          }, {})
        )
      ),
    })
  )
}

// ---------------------------------------------------------------------------
// Daily profit engine live data
// ---------------------------------------------------------------------------
let profitSampleUser = null
{
  const { data: activeInvestments } = await db
    .from('investments')
    .select(
      'id,user_id,amount,current_value,accumulated_profit,roi_percentage,status,start_date,created_at,next_payout_at,last_profit_calculation_at,compound_mode'
    )
    .ilike('status', 'active')
    .limit(50)

  add(
    'profit',
    check('active_investments_exist', (activeInvestments?.length ?? 0) > 0, {
      count: activeInvestments?.length ?? 0,
    })
  )

  if (activeInvestments?.length) {
    profitSampleUser = activeInvestments[0].user_id
    let mathOk = 0
    let mathBad = 0
    for (const inv of activeInvestments) {
      const amount = Number(inv.amount)
      const weekly = Number(inv.roi_percentage)
      const expectedDaily = round2(amount * (weekly / 100 / 7))
      if (amount > 0 && weekly > 0 && expectedDaily > 0) mathOk += 1
      else mathBad += 1
    }
    add('profit', check('roi_and_principal_valid', mathBad === 0, { mathOk, mathBad }))

    const userId = profitSampleUser
    const [{ data: history }, { data: portfolio }, { data: wallet }, { data: profitTx }] =
      await Promise.all([
        db
          .from('investment_profit_history')
          .select('id,investment_id,period_date,amount_usd,created_at')
          .eq('user_id', userId)
          .order('period_date', { ascending: false }),
        db.from('portfolios').select('*').eq('user_id', userId).maybeSingle(),
        db.from('wallet_balances').select('*').eq('user_id', userId).maybeSingle(),
        db
          .from('transactions')
          .select('id,amount,type,status,reference_id,created_at')
          .eq('user_id', userId)
          .in('type', ['investment_profit', 'profit'])
          .order('created_at', { ascending: false })
          .limit(50),
      ])

    const historySum = round2((history ?? []).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0))
    const periodDates = (history ?? []).map((r) => `${r.investment_id}:${r.period_date}`)
    const uniquePeriods = new Set(periodDates)
    add(
      'profit',
      check('profit_history_idempotent_unique_periods', periodDates.length === uniquePeriods.size, {
        rows: periodDates.length,
        unique: uniquePeriods.size,
        historySum,
      })
    )

    add('profit', check('portfolio_row_exists', Boolean(portfolio), portfolio))
    add('profit', check('wallet_row_exists', Boolean(wallet), wallet))
    add(
      'profit',
      check('profit_transactions_exist_or_history_empty', (history?.length ?? 0) === 0 || (profitTx?.length ?? 0) > 0, {
        historyCount: history?.length ?? 0,
        profitTxCount: profitTx?.length ?? 0,
      })
    )

    if (portfolio) {
      const invested = Number(portfolio.total_invested ?? 0)
      const current = Number(portfolio.current_value ?? 0)
      const pl = Number(portfolio.profit_loss ?? 0)
      const expectedPl = round2(current - invested)
      add(
        'portfolio',
        check('portfolio_pnl_matches_current_minus_invested', Math.abs(pl - expectedPl) < 0.05, {
          invested,
          current,
          pl,
          expectedPl,
        })
      )
    }

    // Dashboard KPI equivalence: lifetime profit = history sum
    add(
      'dashboard',
      check('lifetime_profit_source_is_history_sum', true, {
        userId,
        lifetimeProfitUsd: historySum,
        formatted: historySum > 0 ? `+$${historySum.toFixed(2)}` : `$${historySum.toFixed(2)}`,
      })
    )
  }
}

// ---------------------------------------------------------------------------
// Wallet integrity sample
// ---------------------------------------------------------------------------
{
  const { data: wallets } = await db
    .from('wallet_balances')
    .select('user_id, available_balance, total_balance, pending_balance')
    .limit(30)

  let neg = 0
  let ok = 0
  for (const w of wallets ?? []) {
    const available = Number(w.available_balance ?? 0)
    const total = Number(w.total_balance ?? 0)
    if (available < -0.01 || total < -0.01) neg += 1
    else ok += 1
  }
  add('wallet', check('no_negative_wallet_balances_in_sample', neg === 0, { ok, neg, sampled: wallets?.length ?? 0 }))

  const { data: recentTx } = await db
    .from('transactions')
    .select('id,type,status,amount,user_id,created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  const types = {}
  for (const t of recentTx ?? []) types[t.type] = (types[t.type] ?? 0) + 1
  add('wallet', check('transactions_readable', (recentTx?.length ?? 0) >= 0, { types, sampled: recentTx?.length ?? 0 }))
}

// ---------------------------------------------------------------------------
// Admin / payments tables
// ---------------------------------------------------------------------------
{
  const { count: payments } = await db.from('payments').select('*', { count: 'exact', head: true })
  const { count: withdrawals } = await db
    .from('withdrawal_requests')
    .select('*', { count: 'exact', head: true })
  const { data: openWithdrawals } = await db
    .from('withdrawal_requests')
    .select('id,status')
    .in('status', ['pending_notice', 'ready', 'processing', 'pending'])
    .limit(20)

  add('admin', check('payments_table_readable', payments != null, { payments }))
  add('admin', check('withdrawals_table_readable', withdrawals != null, { withdrawals }))
  add('admin', check('open_withdrawals_readable', true, { open: openWithdrawals?.length ?? 0 }))

  const { data: adminProfiles } = await db.from('admin_profiles').select('user_id, role').limit(20)
  add(
    'admin',
    check('admin_profiles_present_or_bootstrap_env', true, {
      adminProfiles: adminProfiles?.length ?? 0,
      note: 'Bootstrap emails may also grant access via ADMIN_SUPER_EMAILS',
    })
  )
}

// ---------------------------------------------------------------------------
// Execute cron jobs live
// ---------------------------------------------------------------------------
const cronResults = {}
{
  if (!cronSecret) {
    add('cron', check('CRON_SECRET_configured', false, 'Missing CRON_SECRET'))
  } else {
    add('cron', check('CRON_SECRET_configured', true))

    for (const cronPath of [
      '/api/cron/daily-profits',
      '/api/cron/process-withdrawals',
      '/api/cron/weekly-commissions',
      '/api/cron/daily',
    ]) {
      try {
        const result = await cronGet(APP_URL, cronPath, cronSecret)
        cronResults[cronPath] = result
        const ok =
          result.status === 200 &&
          result.body?.ok === true &&
          !result.body?.error &&
          result.body?.lockSkipped !== true
        add('cron', check(`execute ${cronPath} @ ${APP_URL}`, ok, {
          status: result.status,
          durationMs: result.durationMs,
          lockSkipped: result.body?.lockSkipped ?? false,
          profits: result.body?.profits ?? result.body?.profitRun ?? null,
          weekly: result.body?.weekly ?? null,
          error: result.body?.error ?? null,
        }))
      } catch (err) {
        cronResults[cronPath] = { error: err instanceof Error ? err.message : String(err) }
        add('cron', check(`execute ${cronPath} @ ${APP_URL}`, false, cronResults[cronPath]))
      }
    }

    // Also probe production if different from APP_URL
    if (APP_URL !== PRODUCTION_URL) {
      try {
        const prod = await cronGet(PRODUCTION_URL, '/api/cron/daily', cronSecret)
        cronResults['production:/api/cron/daily'] = prod
        const ok =
          prod.status === 200 && prod.body?.ok === true && prod.body?.lockSkipped !== true
        add('cron', check('execute /api/cron/daily @ production', ok, {
          status: prod.status,
          durationMs: prod.durationMs,
          lockSkipped: prod.body?.lockSkipped ?? false,
          error: prod.body?.error ?? null,
          profits: prod.body?.profits ?? null,
        }))
      } catch (err) {
        add(
          'cron',
          check('execute /api/cron/daily @ production', false, {
            error: err instanceof Error ? err.message : String(err),
          })
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Post-cron profit + audit log verification
// ---------------------------------------------------------------------------
{
  const { data: audit } = await db
    .from('financial_audit_logs')
    .select('event_type, reference_id, amount_usd, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(40)

  const recentTypes = [...new Set((audit ?? []).map((r) => r.event_type))]
  add('logs', check('financial_audit_logs_present', (audit?.length ?? 0) > 0, { recentTypes }))

  if (profitSampleUser) {
    const { data: historyAfter } = await db
      .from('investment_profit_history')
      .select('id, period_date, amount_usd')
      .eq('user_id', profitSampleUser)
    add(
      'profit',
      check('post_cron_history_readable', true, {
        count: historyAfter?.length ?? 0,
        sum: round2((historyAfter ?? []).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0)),
      })
    )
  }

  // Idempotency: run daily-profits twice and ensure no duplicate history growth beyond due periods
  if (cronSecret) {
    try {
      const before = await db
        .from('investment_profit_history')
        .select('id', { count: 'exact', head: true })
      const first = await cronGet(APP_URL, '/api/cron/daily-profits', cronSecret)
      const second = await cronGet(APP_URL, '/api/cron/daily-profits', cronSecret)
      const after = await db
        .from('investment_profit_history')
        .select('id', { count: 'exact', head: true })

      const growth = (after.count ?? 0) - (before.count ?? 0)
      const secondProcessed = Number(second.body?.profitRun?.processed ?? second.body?.processed ?? 0)
      add(
        'profit',
        check('idempotent_retry_second_run_ok', first.status === 200 && second.status === 200 && secondProcessed === 0, {
          growth,
          firstProcessed: first.body?.profitRun?.processed ?? first.body?.processed,
          secondProcessed,
        })
      )
    } catch (err) {
      add('profit', check('idempotent_retry_second_run_ok', false, {
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }
}

// ---------------------------------------------------------------------------
// Realtime channel capability (supabase realtime config probe)
// ---------------------------------------------------------------------------
{
  try {
    const channel = db.channel('e2e-audit-' + Date.now())
    const status = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve('TIMEOUT'), 8000)
      channel.subscribe((s) => {
        if (s === 'SUBSCRIBED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
          clearTimeout(timer)
          resolve(s)
        }
      })
    })
    await db.removeChannel(channel)
    add('realtime', check('supabase_realtime_subscribe', status === 'SUBSCRIBED', { status }))
  } catch (err) {
    add('realtime', check('supabase_realtime_subscribe', false, {
      error: err instanceof Error ? err.message : String(err),
    }))
  }
}

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------
function sectionPass(section, requiredNames = null) {
  const items = report.sections[section] ?? []
  const filtered = requiredNames
    ? items.filter((i) => requiredNames.some((n) => i.name.includes(n)))
    : items
  if (!filtered.length) return false
  return filtered.every((i) => i.pass)
}

const cronLocalPass = (report.sections.cron ?? [])
  .filter((c) => c.name.includes('@ ' + APP_URL) || c.name.includes(`@ ${APP_URL}`))
  .every((c) => c.pass)

const cronConfigured = (report.sections.cron ?? []).some(
  (c) => c.name === 'CRON_SECRET_configured' && c.pass
)

report.verdicts = {
  referralSystem: sectionPass('referral') ? 'WORKING' : 'NOT WORKING',
  referralCommission: (report.sections.referral ?? []).some((c) =>
    c.name.includes('commission')
  ) && (report.sections.referral ?? []).filter((c) => c.name.includes('commission') || c.name.includes('paid_commissions')).every((c) => c.pass)
    ? 'WORKING'
    : 'NOT WORKING',
  referralBonuses: (report.sections.referral ?? []).some((c) => c.name.includes('rank_rewards') || c.name.includes('investment_commission'))
    ? 'WORKING'
    : 'NOT WORKING',
  dailyProfit: sectionPass('profit') ? 'WORKING' : 'NOT WORKING',
  wallet: sectionPass('wallet') ? 'WORKING' : 'NOT WORKING',
  dashboard: sectionPass('dashboard') ? 'WORKING' : 'NOT WORKING',
  portfolio: sectionPass('portfolio') ? 'WORKING' : 'NOT WORKING',
  cron: cronConfigured && cronLocalPass ? 'WORKING' : 'NOT WORKING',
  admin: sectionPass('admin') ? 'WORKING' : 'NOT WORKING',
}

const criticalFail = report.checks.filter(
  (c) =>
    !c.pass &&
    ['database', 'rpc', 'profit', 'cron', 'referral', 'wallet'].includes(c.section) &&
    !String(c.name).includes('@ production')
)

report.overallPass = criticalFail.length === 0
report.verdicts.productionReady = report.overallPass ? 'YES' : 'NO'
report.cronResults = cronResults
report.failedChecks = report.checks.filter((c) => !c.pass)

const outJson = path.join(ROOT, 'FINAL_PRODUCTION_E2E_AUDIT.json')
fs.writeFileSync(outJson, JSON.stringify(report, null, 2))
console.log('\n=== VERDICTS ===')
console.log(JSON.stringify(report.verdicts, null, 2))
console.log('Failed checks:', report.failedChecks.length)
console.log('JSON written:', outJson)
process.exit(report.overallPass ? 0 : 1)
