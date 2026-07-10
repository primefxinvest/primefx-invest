#!/usr/bin/env node
/**
 * Runs read-only financial reset verification against DATABASE_URL.
 * Optionally executes scripts/financial-reset.sql when --execute is passed.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/run-financial-reset-audit.mjs
 *   DATABASE_URL=postgresql://... node scripts/run-financial-reset-audit.mjs --execute
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const VERIFY_QUERIES = [
  {
    name: 'financial_counts',
    sql: `
      SELECT
        (SELECT COUNT(*) FROM transactions) AS transactions,
        (SELECT COUNT(*) FROM payments) AS payments,
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

function auditPassed(results) {
  const financial = parseCounts(results.financial_counts.rows[0] ?? {})
  const wallet = parseCounts(results.wallet_totals.rows[0] ?? {})
  const portfolio = parseCounts(results.portfolio_totals.rows[0] ?? {})

  const financialKeys = Object.keys(financial)
  const financialClean = financialKeys.every((key) => financial[key] === 0)
  const walletClean =
    wallet.total_balance_sum === 0 &&
    wallet.pending_balance_sum === 0 &&
    wallet.bonus_balance_sum === 0
  const portfolioClean =
    portfolio.invested_sum === 0 && portfolio.value_sum === 0 && portfolio.profit_sum === 0

  return financialClean && walletClean && portfolioClean
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  const executeReset = process.argv.includes('--execute')

  if (!databaseUrl) {
    console.log('DATABASE_URL is not set — verification queries were not executed against a database.')
    console.log('Review scripts/financial-reset.sql and scripts/verify-financial-reset.sql manually.')
    process.exit(0)
  }

  let pg
  try {
    pg = (await import('pg')).default
  } catch {
    console.error('Install pg to run database audits: npm install --save-dev pg')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    if (executeReset) {
      const resetSql = readFileSync(join(root, 'scripts/financial-reset.sql'), 'utf8')
      console.log('Executing financial reset (transactional)...')
      await client.query(resetSql)
      console.log('Financial reset completed successfully.')
    }

    const results = {}
    for (const query of VERIFY_QUERIES) {
      const { rows } = await client.query(query.sql)
      results[query.name] = { rows }
      console.log(`\n[${query.name}]`)
      console.table(rows)
    }

    const passed = auditPassed(results)
    if (passed) {
      console.log('\n✅ Financial reset audit PASSED — all financial counters are zero.')
      process.exit(0)
    }

    console.error('\n❌ Financial reset audit FAILED — residual financial records detected.')
    if (!executeReset) {
      console.error('Re-run with --execute to apply scripts/financial-reset.sql, then verify again.')
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
