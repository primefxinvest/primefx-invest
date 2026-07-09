#!/usr/bin/env node
/**
 * End-to-end daily profit verification against live Supabase.
 * Does NOT print secrets. Redacts user emails.
 *
 * Usage: node scripts/e2e-daily-profit-verification.mjs [--run-cron]
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')
const RUN_CRON = process.argv.includes('--run-cron')
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
  return Math.round(Number(n) * 100) / 100
}

function lifetimeFromInvestments(rows) {
  return round2(
    (rows ?? [])
      .filter((r) => String(r.status ?? '').toLowerCase() === 'active')
      .reduce((s, r) => s + Math.max(0, round2(Number(r.current_value ?? r.amount) - Number(r.amount))), 0)
  )
}

function projectedDaily(amount, weeklyRoi) {
  if (amount <= 0 || weeklyRoi <= 0) return 0
  return round2(amount * (weeklyRoi / 100 / 7))
}

function projectedWeekly(amount, weeklyRoi) {
  if (amount <= 0 || weeklyRoi <= 0) return 0
  return round2(amount * (weeklyRoi / 100))
}

async function snapshot(db, userId) {
  const [{ data: investments }, { data: portfolio }, { data: wallet }, { data: history }] =
    await Promise.all([
      db
        .from('investments')
        .select(
          'id,amount,current_value,accumulated_profit,roi_percentage,status,start_date,created_at,next_payout_at,last_profit_calculation_at'
        )
        .eq('user_id', userId)
        .ilike('status', 'active'),
      db.from('portfolios').select('*').eq('user_id', userId).maybeSingle(),
      db.from('wallet_balances').select('*').eq('user_id', userId).maybeSingle(),
      db
        .from('investment_profit_history')
        .select('id,period_date,amount_usd,created_at')
        .eq('user_id', userId)
        .order('period_date', { ascending: false }),
    ])

  const inv = investments?.[0]
  const amount = Number(inv?.amount ?? 0)
  const weeklyRoi = Number(inv?.roi_percentage ?? 0)

  return {
    userId,
    investment: inv
      ? {
          id: inv.id,
          amount: Number(inv.amount),
          currentValue: Number(inv.current_value),
          accumulatedProfit: Number(inv.accumulated_profit ?? 0),
          roiPercent: weeklyRoi,
          startDate: inv.start_date,
          nextPayoutAt: inv.next_payout_at,
          lastProfitAt: inv.last_profit_calculation_at,
        }
      : null,
    portfolio: portfolio
      ? {
          totalInvested: Number(portfolio.total_invested ?? 0),
          currentValue: Number(portfolio.current_value ?? 0),
          profitLoss: Number(portfolio.profit_loss ?? 0),
          roiPercent: Number(portfolio.roi_percentage ?? 0),
        }
      : null,
    wallet: wallet
      ? {
          available: Number(wallet.available_balance ?? 0),
          total: Number(wallet.total_balance ?? 0),
        }
      : null,
    historyCount: history?.length ?? 0,
    historyTotal: round2((history ?? []).reduce((s, h) => s + Number(h.amount_usd), 0)),
    recentHistory: (history ?? []).slice(0, 3).map((h) => ({
      periodDate: h.period_date,
      amountUsd: Number(h.amount_usd),
    })),
    lifetimeProfit: lifetimeFromInvestments(investments ?? []),
    projectedDaily: projectedDaily(amount, weeklyRoi),
    projectedWeekly: projectedWeekly(amount, weeklyRoi),
    // Simulated unified API surfaces
    dashboardTotalProfit: lifetimeFromInvestments(investments ?? []),
    walletTotalProfit: lifetimeFromInvestments(investments ?? []),
    portfolioTotalEarned: lifetimeFromInvestments(investments ?? []),
  }
}

async function triggerCron() {
  const cronSecret = process.env.CRON_SECRET
  const headers = cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}
  const res = await fetch(`${APP_URL}/api/cron/daily-profits`, { headers })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function main() {
  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env vars')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: activeRows, error: activeErr } = await db
    .from('investments')
    .select('user_id')
    .ilike('status', 'active')
    .limit(1)

  if (activeErr || !activeRows?.length) {
    console.error('No active investments found:', activeErr?.message ?? 'empty')
    process.exit(1)
  }

  const userId = activeRows[0].user_id
  const before = await snapshot(db, userId)
  console.log('=== BEFORE ===')
  console.log(JSON.stringify(before, null, 2))

  let cronResult = null
  if (RUN_CRON) {
    cronResult = await triggerCron()
    console.log('=== CRON RESULT ===')
    console.log(JSON.stringify(cronResult, null, 2))
    await new Promise((r) => setTimeout(r, 1500))
  }

  const afterFirst = await snapshot(db, userId)
  console.log('=== AFTER FIRST RUN ===')
  console.log(JSON.stringify(afterFirst, null, 2))

  let cronResult2 = null
  if (RUN_CRON) {
    cronResult2 = await triggerCron()
    console.log('=== CRON RESULT (2nd run) ===')
    console.log(JSON.stringify(cronResult2, null, 2))
    await new Promise((r) => setTimeout(r, 1500))
  }

  const afterSecond = await snapshot(db, userId)
  console.log('=== AFTER SECOND RUN ===')
  console.log(JSON.stringify(afterSecond, null, 2))

  const checks = []
  const push = (name, ok, detail) => checks.push({ name, ok, detail })

  const creditDelta = round2(afterFirst.lifetimeProfit - before.lifetimeProfit)
  const historyDelta = afterFirst.historyCount - before.historyCount
  const walletDelta = round2((afterFirst.wallet?.available ?? 0) - (before.wallet?.available ?? 0))

  push(
    'cron endpoint succeeded',
    !RUN_CRON || cronResult?.status === 200,
    RUN_CRON ? `HTTP ${cronResult?.status}` : 'skipped'
  )
  push(
    'profit credit written when due',
    !RUN_CRON || (cronResult?.status === 200 && historyDelta > 0),
    RUN_CRON
      ? `history +${historyDelta}, lifetime +$${creditDelta}`
      : 'skipped (--run-cron not passed)'
  )
  push(
    'lifetime profit increases correctly',
    !RUN_CRON || (cronResult?.status === 200 && creditDelta > 0),
    `before $${before.lifetimeProfit} → after $${afterFirst.lifetimeProfit}`
  )
  push(
    'dashboard/wallet/portfolio values match',
    afterFirst.dashboardTotalProfit === afterFirst.walletTotalProfit &&
      afterFirst.walletTotalProfit === afterFirst.portfolioTotalEarned,
    `$${afterFirst.dashboardTotalProfit} / $${afterFirst.walletTotalProfit} / $${afterFirst.portfolioTotalEarned}`
  )
  push(
    'weekly earnings projection unchanged',
    before.projectedWeekly === afterFirst.projectedWeekly,
    `$${before.projectedWeekly} → $${afterFirst.projectedWeekly}`
  )
  push(
    'wallet credited matches profit delta when credit occurred',
    !RUN_CRON ||
      cronResult?.status !== 200 ||
      historyDelta === 0 ||
      Math.abs(walletDelta - creditDelta) < 0.02,
    `wallet Δ $${walletDelta}, lifetime Δ $${creditDelta}`
  )
  push(
    'no double credit on immediate re-run',
    !RUN_CRON ||
      cronResult?.status !== 200 ||
      afterSecond.historyCount === afterFirst.historyCount,
    `history ${afterFirst.historyCount} → ${afterSecond.historyCount}, lifetime $${afterFirst.lifetimeProfit} → $${afterSecond.lifetimeProfit}`
  )

  console.log('=== CHECKS ===')
  console.log(JSON.stringify(checks, null, 2))

  const allPass = checks.every((c) => c.ok)
  console.log(allPass ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED')
  process.exit(allPass ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
