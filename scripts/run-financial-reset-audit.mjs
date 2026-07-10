#!/usr/bin/env node
/**
 * Runs read-only financial reset verification against DATABASE_URL or Supabase service role.
 * Optionally executes reset when --execute is passed.
 *
 * Usage:
 *   node scripts/run-financial-reset-audit.mjs
 *   node scripts/run-financial-reset-audit.mjs --execute
 *
 * Env (auto-loaded from .env.local / .env):
 *   DATABASE_URL — direct Postgres (preferred)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — fallback via PostgREST
 *   SUPABASE_DB_PASSWORD — optional; builds DATABASE_URL if set
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  collectVerificationReport,
  executeFinancialResetSupabase,
  snapshotPreflight,
  verifyFinancialZero,
} from './financial-reset-supabase.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = join(root, file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, '')
      }
    }
  }
}

function extractProjectRef(supabaseUrl) {
  const match = String(supabaseUrl ?? '').match(/https:\/\/([^.]+)\.supabase\.co/i)
  return match?.[1] ?? null
}

function resolveDatabaseUrl() {
  const direct =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim()

  if (direct) return direct

  const password = process.env.SUPABASE_DB_PASSWORD?.trim() || process.env.POSTGRES_PASSWORD?.trim()
  const ref = extractProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (password && ref) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`
  }

  return null
}

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

const VERIFY_QUERIES = [
  {
    name: 'financial_counts',
    sql: `
      SELECT
        (SELECT COUNT(*) FROM transactions) AS transactions,
        (SELECT COUNT(*) FROM payments) AS payments,
        (SELECT COUNT(*) FROM payments WHERE type = 'deposit') AS deposits,
        (SELECT COUNT(*) FROM withdrawal_requests) AS withdrawal_requests,
        (SELECT COUNT(*) FROM investments) AS investments,
        (SELECT COUNT(*) FROM investment_profit_history) AS profit_history,
        (SELECT COUNT(*) FROM referral_commissions) AS referral_commissions,
        (SELECT COUNT(*) FROM referral_rank_rewards) AS rank_rewards,
        (SELECT COUNT(*) FROM user_reward_redemptions) AS reward_redemptions,
        (SELECT COUNT(*) FROM financial_audit_logs) AS financial_audit_logs
    `,
  },
  {
    name: 'wallet_totals',
    sql: `
      SELECT
        COALESCE(SUM(total_balance), 0) AS total_balance_sum,
        COALESCE(SUM(pending_balance), 0) AS pending_balance_sum,
        COALESCE(SUM(bonus_balance), 0) AS bonus_balance_sum
      FROM wallet_balances
    `,
  },
  {
    name: 'portfolio_totals',
    sql: `
      SELECT
        COALESCE(SUM(total_invested), 0) AS invested_sum,
        COALESCE(SUM(current_value), 0) AS value_sum,
        COALESCE(SUM(profit_loss), 0) AS profit_sum
      FROM portfolios
    `,
  },
  {
    name: 'preserved_users',
    sql: `SELECT COUNT(*) AS user_count FROM users`,
  },
]

function parseCounts(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, Number(value ?? 0)])
  )
}

function auditPassedFromPg(results) {
  const financial = parseCounts(results.financial_counts.rows[0] ?? {})
  const wallet = parseCounts(results.wallet_totals.rows[0] ?? {})
  const portfolio = parseCounts(results.portfolio_totals.rows[0] ?? {})

  const financialClean = Object.values(financial).every((value) => value === 0)
  const walletClean =
    wallet.total_balance_sum === 0 &&
    wallet.pending_balance_sum === 0 &&
    wallet.bonus_balance_sum === 0
  const portfolioClean =
    portfolio.invested_sum === 0 && portfolio.value_sum === 0 && portfolio.profit_sum === 0

  return financialClean && walletClean && portfolioClean
}

async function runPgVerification(client) {
  const results = {}
  for (const query of VERIFY_QUERIES) {
    const { rows } = await client.query(query.sql)
    results[query.name] = { rows }
    console.log(`\n[${query.name}]`)
    console.table(rows)
  }
  return { results, passed: auditPassedFromPg(results) }
}

async function runSupabaseVerification(db) {
  const report = await collectVerificationReport(db)
  console.log('\n[financial_counts]')
  console.table([report.financial_counts])
  console.log('\n[wallet_totals]')
  console.table([report.wallet_totals])
  console.log('\n[portfolio_totals]')
  console.table([report.portfolio_totals])
  console.log('\n[preserved_entities]')
  console.table([report.preserved_users])
  return report
}

function printConnectionInfo() {
  const ref = extractProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log(`Supabase project ref: ${ref ?? 'unknown'}`)
  console.log(`Connection mode: ${resolveDatabaseUrl() ? 'postgres (DATABASE_URL)' : 'service_role (PostgREST)'}`)
}

async function main() {
  loadEnv()
  const executeReset = process.argv.includes('--execute')
  const databaseUrl = resolveDatabaseUrl()
  const supabase = createSupabaseAdmin()

  if (!databaseUrl && !supabase) {
    console.error(
      'Missing database credentials. Set DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  printConnectionInfo()

  if (databaseUrl) {
    let pg
    try {
      pg = (await import('pg')).default
    } catch {
      console.error('Install pg for DATABASE_URL mode: npm install --save-dev pg')
      process.exit(1)
    }

    const client = new pg.Client({ connectionString: databaseUrl })
    await client.connect()

    try {
      if (executeReset) {
        const resetSql = readFileSync(join(root, 'scripts/financial-reset.sql'), 'utf8')
        console.log('\nExecuting financial reset via SQL (transactional)...')
        await client.query(resetSql)
        console.log('Financial reset completed successfully.')
      }

      const { passed } = await runPgVerification(client)
      if (passed) {
        console.log('\n✅ Financial reset audit PASSED — all financial counters are zero.')
        process.exit(0)
      }

      console.error('\n❌ Financial reset audit FAILED — residual financial records detected.')
      process.exit(1)
    } finally {
      await client.end()
    }
  }

  if (!supabase) {
    console.error('Supabase service role client unavailable.')
    process.exit(1)
  }

  const preflight = await snapshotPreflight(supabase)
  console.log('\n[preflight preserved counts]')
  console.table([preflight])

  if (executeReset) {
    console.log('\nExecuting financial reset via Supabase service role...')
    const result = await executeFinancialResetSupabase(supabase)
    console.log('Financial reset completed successfully.')
    console.log('Rows deleted:', result.deleted)
  }

  const report = await runSupabaseVerification(supabase)
  try {
    await verifyFinancialZero(supabase)
    console.log('\n✅ Financial reset audit PASSED — all financial counters are zero.')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Financial reset audit FAILED —', err instanceof Error ? err.message : err)
    if (!executeReset) {
      console.error('Re-run with --execute to apply the reset, then verify again.')
    }
    process.exit(report.passed ? 0 : 1)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
