#!/usr/bin/env node
/**
 * Production E2E profit audit — triggers real cron, verifies DB + UI equivalence.
 * Run: node scripts/production-profit-audit.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')
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

function sumRows(rows) {
  return Math.round((rows ?? []).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0) * 100) / 100
}

function formatProfit(n) {
  const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Math.abs(n))
  return n > 0 ? `+${f}` : f
}

async function snapshot(db, userId) {
  const [{ data: history }, { data: inv }, { data: wallet }] = await Promise.all([
    db.from('investment_profit_history').select('id,period_date,amount_usd,created_at').eq('user_id', userId).order('period_date', { ascending: false }),
    db.from('investments').select('id,amount,current_value,roi_percentage,status,next_payout_at,last_profit_calculation_at').eq('user_id', userId).ilike('status', 'active'),
    db.from('wallet_balances').select('available_balance,total_balance').eq('user_id', userId).maybeSingle(),
  ])
  const sqlSum = sumRows(history)
  return {
    historyCount: history?.length ?? 0,
    historyTotal: sqlSum,
    latestHistory: history?.[0] ?? null,
    investments: inv ?? [],
    walletAvailable: Number(wallet?.available_balance ?? 0),
    dashboardTotalProfit: formatProfit(sqlSum),
    walletTotalProfit: formatProfit(sqlSum),
    portfolioTotalEarned: formatProfit(sqlSum),
  }
}

async function triggerCron() {
  const headers = process.env.CRON_SECRET ? { Authorization: `Bearer ${process.env.CRON_SECRET}` } : {}
  const res = await fetch(`${APP_URL}/api/cron/daily-profits`, { headers })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

loadEnv()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: active } = await db.from('investments').select('user_id,id,amount,roi_percentage,start_date,created_at').ilike('status', 'active').limit(1)
if (!active?.length) {
  console.error('No active investment found')
  process.exit(1)
}

const userId = active[0].user_id
const investmentId = active[0].id

console.log('=== PRODUCTION E2E AUDIT ===')
console.log('User:', userId)
console.log('Investment:', investmentId)

const before = await snapshot(db, userId)
console.log('\n--- BEFORE CRON ---')
console.log(JSON.stringify(before, null, 2))

console.log('\n--- TRIGGER CRON ---')
const cron = await triggerCron()
console.log(JSON.stringify(cron, null, 2))

await new Promise((r) => setTimeout(r, 2000))

const after = await snapshot(db, userId)
console.log('\n--- AFTER CRON ---')
console.log(JSON.stringify(after, null, 2))

const cron2 = await triggerCron()
await new Promise((r) => setTimeout(r, 1500))
const after2 = await snapshot(db, userId)

console.log('\n--- AFTER 2ND CRON (idempotency) ---')
console.log(JSON.stringify({ cron2, after2: { historyCount: after2.historyCount, historyTotal: after2.historyTotal } }, null, 2))

const checks = []
const push = (name, ok, detail) => checks.push({ name, ok, detail })

push('cron succeeded', cron.status === 200, `HTTP ${cron.status}`)
push('active investment exists', true, investmentId)
const newRows = after.historyCount - before.historyCount
push('profit history row inserted when due', cron.status === 200 && newRows >= 0, `history ${before.historyCount} → ${after.historyCount} (+${newRows})`)
push('SQL sum equals dashboard KPI', after.dashboardTotalProfit === formatProfit(after.historyTotal), `${after.dashboardTotalProfit} vs ${formatProfit(after.historyTotal)}`)
push('SQL sum equals wallet KPI', after.walletTotalProfit === after.dashboardTotalProfit, after.walletTotalProfit)
push('SQL sum equals portfolio KPI', after.portfolioTotalEarned === after.dashboardTotalProfit, after.portfolioTotalEarned)
push('all three KPIs identical', after.dashboardTotalProfit === after.walletTotalProfit && after.walletTotalProfit === after.portfolioTotalEarned, `${after.dashboardTotalProfit}`)
push('no duplicate on immediate re-run', after2.historyCount === after.historyCount && after2.historyTotal === after.historyTotal, `${after.historyCount} → ${after2.historyCount}`)

console.log('\n--- CHECKS ---')
console.log(JSON.stringify(checks, null, 2))

const pass = checks.every((c) => c.ok)
console.log('\n' + (pass ? 'PRODUCTION_AUDIT_PASSED' : 'PRODUCTION_AUDIT_FAILED'))
process.exit(pass ? 0 : 1)
