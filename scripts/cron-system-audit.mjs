#!/usr/bin/env node
/**
 * Production cron system audit — probes endpoints, DB RPCs, and Vercel registration.
 * Usage: node scripts/cron-system-audit.mjs [--json]
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')
const PRODUCTION_URL = 'https://www.primefxinvest.com'
const CRON_SCHEDULE = '0 22 * * *'

const JOBS = [
  {
    id: 'daily-unified',
    name: 'Unified Daily Cron',
    registered: true,
    schedule: CRON_SCHEDULE,
    path: '/api/cron/daily',
    includes: [
      'Withdrawal hold promotion (pending_notice → ready)',
      'Withdrawal hold reminders (3-day / 1-day notifications)',
      'NOWPayments / open deposit reconciliation',
      'Daily investment profit accrual',
      'Weekly referral distribution (Fridays, UTC day 5)',
      'Capital withdrawal processing',
    ],
  },
  {
    id: 'daily-profits',
    name: 'Daily Profit Cron (manual)',
    registered: false,
    schedule: 'Manual / admin only',
    path: '/api/cron/daily-profits',
    includes: ['Daily investment profit accrual only'],
  },
  {
    id: 'process-withdrawals',
    name: 'Withdrawal Ready-for-Payout Cron (manual)',
    registered: false,
    schedule: 'Manual / admin only',
    path: '/api/cron/process-withdrawals',
    includes: ['Withdrawal hold promotion + hold reminders'],
  },
  {
    id: 'weekly-commissions',
    name: 'Weekly Referral Commissions (manual)',
    registered: false,
    schedule: 'Manual / admin only (Friday in unified cron)',
    path: '/api/cron/weekly-commissions',
    includes: ['Referral distribution + capital withdrawals'],
  },
  {
    id: 'deposit-webhook',
    name: 'NOWPayments Deposit Webhook',
    registered: false,
    schedule: 'Event-driven (real-time)',
    path: '/api/webhooks/nowpayments',
    includes: ['Primary deposit credit path'],
  },
  {
    id: 'deposit-sync',
    name: 'Deposit Verification / Reconciliation',
    registered: false,
    schedule: 'Daily (inside unified cron) + success-page poll',
    path: 'lib/payments/deposit-sync.ts → syncAllOpenDeposits',
    includes: ['Missed webhook recovery for open crypto deposits'],
  },
  {
    id: 'admin-financial-jobs',
    name: 'Admin Manual Financial Jobs',
    registered: false,
    schedule: 'On-demand (Platform Owner)',
    path: 'processDueFinancialJobsAction',
    includes: ['Withdrawals + capital + deposit sync without profits'],
  },
]

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(ROOT, file)
    if (!fs.existsSync(envPath)) continue
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, '')
      }
    }
  }
}

function nextCronUtc(schedule = CRON_SCHEDULE) {
  const [minute, hour] = schedule.split(' ').map(Number)
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0, 0))
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

async function probeHttp(url, headers = {}) {
  const started = Date.now()
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
    const body = await res.text()
    let json = null
    try {
      json = JSON.parse(body)
    } catch {
      json = body.slice(0, 200)
    }
    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      body: json,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function probeRpc(db, name, args) {
  const { data, error } = await db.rpc(name, args)
  return {
    name,
    present: !error || !String(error.message).includes('Could not find the function'),
    error: error?.message ?? null,
    sample: data ?? null,
  }
}

async function probeTable(db, table) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
  return {
    table,
    present: !error || !String(error.message).includes('schema cache'),
    count: error ? null : count,
    error: error?.message ?? null,
  }
}

async function main() {
  loadEnv()

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
  const registeredCrons = vercelConfig.crons ?? []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const cronSecret = process.env.CRON_SECRET
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? 'unknown'

  const report = {
    auditedAt: new Date().toISOString(),
    productionUrl: PRODUCTION_URL,
    supabaseProjectRef: projectRef,
    cronSecretConfiguredLocally: Boolean(cronSecret),
    vercelCrons: registeredCrons,
    nextScheduledRunUtc: nextCronUtc().toISOString(),
    httpProbes: {},
    database: {},
    jobs: JOBS,
    fixesApplied: [
      'lib/cron/lock.ts — fallback when acquire_cron_job_lock RPC missing',
      'lib/wallet/withdrawals.ts — fallback when claim_withdrawal_request RPC missing',
      'supabase/migrations/044_restore_cron_integrity.sql — idempotent DB restore',
    ],
  }

  for (const job of registeredCrons) {
    const url = `${PRODUCTION_URL}${job.path}`
    report.httpProbes[job.path] = {
      unauthenticated: await probeHttp(url),
      invalidSecret: await probeHttp(url, { Authorization: 'Bearer invalid-probe' }),
    }
    if (cronSecret) {
      report.httpProbes[job.path].authenticated = await probeHttp(url, {
        Authorization: `Bearer ${cronSecret}`,
      })
    }
  }

  for (const manual of ['/api/cron/daily-profits', '/api/cron/process-withdrawals', '/api/cron/weekly-commissions']) {
    report.httpProbes[manual] = {
      unauthenticated: await probeHttp(`${PRODUCTION_URL}${manual}`),
    }
  }

  if (supabaseUrl && serviceKey) {
    const db = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    report.database.tables = await Promise.all([
      probeTable(db, 'cron_job_locks'),
      probeTable(db, 'financial_audit_logs'),
      probeTable(db, 'investment_profit_runs'),
    ])

    report.database.rpcs = await Promise.all([
      probeRpc(db, 'acquire_cron_job_lock', {
        p_job_name: 'audit_probe',
        p_owner: 'audit',
        p_ttl_seconds: 5,
      }),
      probeRpc(db, 'release_cron_job_lock', { p_job_name: 'audit_probe', p_owner: 'audit' }),
      probeRpc(db, 'claim_withdrawal_request', {
        p_request_id: '00000000-0000-0000-0000-000000000000',
        p_target_status: 'ready',
      }),
      probeRpc(db, 'claim_profit_run_period', {
        p_period_start: '2000-01-01',
        p_period_end: '2000-01-01',
        p_trading_days: 1,
      }),
    ])

    const { data: auditRows } = await db
      .from('financial_audit_logs')
      .select('event_type, reference_id, created_at')
      .like('event_type', 'cron.%')
      .order('created_at', { ascending: false })
      .limit(10)

    report.database.recentCronAuditLogs = auditRows ?? []
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log('=== CRON SYSTEM AUDIT ===')
  console.log('Audited:', report.auditedAt)
  console.log('Production:', report.productionUrl)
  console.log('Supabase ref:', report.supabaseProjectRef)
  console.log('Next Vercel cron (UTC):', report.nextScheduledRunUtc)
  console.log('CRON_SECRET (local):', report.cronSecretConfiguredLocally ? 'SET' : 'NOT SET')
  console.log('\nRegistered Vercel crons:', registeredCrons.length)
  for (const c of registeredCrons) console.log(' -', c.schedule, c.path)

  console.log('\nHTTP probes (/api/cron/daily):')
  console.log(JSON.stringify(report.httpProbes['/api/cron/daily'], null, 2))

  if (report.database.rpcs) {
    console.log('\nDatabase RPCs:')
    for (const rpc of report.database.rpcs) {
      console.log(` - ${rpc.name}: ${rpc.present ? 'PRESENT' : 'MISSING'}${rpc.error ? ` (${rpc.error})` : ''}`)
    }
  }

  if (report.database.recentCronAuditLogs?.length) {
    console.log('\nRecent cron audit logs:', report.database.recentCronAuditLogs.length)
  } else {
    console.log('\nRecent cron audit logs: none')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
