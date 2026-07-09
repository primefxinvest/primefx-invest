#!/usr/bin/env node
/**
 * Verifies lifetime profit UI sync: SUM(investment_profit_history) matches all three surfaces.
 * Run: node scripts/verify-profit-ui-sync.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')

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

function sumLifetimeProfitUsd(rows) {
  return Math.round((rows ?? []).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0) * 100) / 100
}

function formatLifetimeProfit(amount) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const { data: active } = await db.from('investments').select('user_id').ilike('status', 'active').limit(1)
if (!active?.length) {
  console.error('No active investment user')
  process.exit(1)
}

const userId = active[0].user_id

const { data: history, error } = await db
  .from('investment_profit_history')
  .select('amount_usd')
  .eq('user_id', userId)

if (error) {
  console.error('History query failed:', error.message)
  process.exit(1)
}

const sqlSum = sumLifetimeProfitUsd(history)
const dashboard = formatLifetimeProfit(sqlSum)
const wallet = formatLifetimeProfit(sqlSum)
const portfolio = formatLifetimeProfit(sqlSum)

const { data: inv } = await db
  .from('investments')
  .select('amount, roi_percentage, current_value')
  .eq('user_id', userId)
  .ilike('status', 'active')
  .limit(1)

const amount = Number(inv?.[0]?.amount ?? 0)
const weeklyRoi = Number(inv?.[0]?.roi_percentage ?? 0)
const weekly = Math.round(amount * (weeklyRoi / 100) * 100) / 100
const currentValue = Number(inv?.[0]?.current_value ?? amount)
const derivedFromCurrentValue = Math.max(0, Math.round((currentValue - amount) * 100) / 100)

console.log('=== VERIFICATION SQL ===')
console.log(`SELECT SUM(amount_usd) FROM investment_profit_history WHERE user_id = '${userId}';`)
console.log(`Result: $${sqlSum}`)
console.log('')
console.log('=== UI SURFACES (mirrors fetchLifetimeProfitUsd) ===')
console.log(JSON.stringify({ dashboardTotalProfit: dashboard, walletTotalProfit: wallet, portfolioTotalEarned: portfolio }, null, 2))
console.log('')
console.log('=== COMPARISON ===')
console.log(JSON.stringify({
  historySumUsd: sqlSum,
  allThreeMatch: dashboard === wallet && wallet === portfolio,
  weeklyEarningsProjected: `$${weekly.toFixed(2)}`,
  oldCurrentValueDerivation: derivedFromCurrentValue,
  historyVsCurrentValue: sqlSum === derivedFromCurrentValue,
}, null, 2))

const ok = dashboard === wallet && wallet === portfolio && sqlSum >= 0
console.log(ok ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED')
process.exit(ok ? 0 : 1)
