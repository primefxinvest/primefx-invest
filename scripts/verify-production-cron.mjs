#!/usr/bin/env node
/**
 * Complete production cron verification.
 * Requires CRON_SECRET in environment or .env.local for HTTP execution.
 *
 * Usage:
 *   CRON_SECRET=... node scripts/verify-production-cron.mjs
 *   node scripts/verify-production-cron.mjs --report FINAL_CRON_PRODUCTION_REPORT.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')
const PRODUCTION_URL = 'https://www.primefxinvest.com'
const CRON_PATH = '/api/cron/daily'

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

async function probeRpc(db, name, args) {
  const { data, error } = await db.rpc(name, args)
  const present = !error || !String(error.message).includes('Could not find the function')
  return { name, present, error: error?.message ?? null, data: data ?? null }
}

function validateCronResponse(body) {
  const checks = {
    httpOk: body?.ok === true,
    notLockSkipped: body?.lockSkipped !== true,
    withdrawals: body?.withdrawals != null && typeof body.withdrawals === 'object',
    depositSync: body?.depositSync != null && typeof body.depositSync === 'object',
    profits: body?.profits != null && typeof body.profits === 'object',
    capitalWithdrawals: body?.capitalWithdrawals != null && typeof body.capitalWithdrawals === 'object',
    weekly: body?.utcDay === 5 ? body?.weekly != null : true,
    noTopLevelError: !body?.error,
  }

  const subJobs = {
    withdrawalHoldPromotion: {
      pass:
        checks.withdrawals &&
        !body.withdrawals.failed &&
        Array.isArray(body.withdrawals.results),
      detail: body.withdrawals,
    },
    holdReminderNotifications: {
      pass: checks.withdrawals && body.withdrawals.holdReminders != null,
      detail: body.withdrawals?.holdReminders,
    },
    nowpaymentsReconciliation: {
      pass:
        checks.depositSync &&
        typeof body.depositSync.checked === 'number' &&
        typeof body.depositSync.completed === 'number',
      detail: body.depositSync,
    },
    dailyProfit: {
      pass:
        checks.profits &&
        (body.profits.skipped !== true || body.profits.reason) &&
        !String(body.profits.reason ?? '').includes('failed'),
      detail: body.profits,
    },
    weeklyReferralPayout: {
      pass: body?.utcDay === 5 ? body?.weekly != null : true,
      detail: body?.utcDay === 5 ? body.weekly : { skipped: 'Not Friday (UTC)' },
    },
    capitalWithdrawals: {
      pass:
        checks.capitalWithdrawals &&
        typeof body.capitalWithdrawals.processed === 'number',
      detail: body.capitalWithdrawals,
    },
  }

  const subJobFailures = Object.entries(subJobs).filter(([, v]) => !v.pass)
  const allSubJobsPass = subJobFailures.length === 0

  return { checks, subJobs, allSubJobsPass, subJobFailures }
}

function buildMarkdown(report) {
  const status = report.overallPass ? '✅ SUCCESS' : '❌ FAIL'
  const lines = [
    '# Final Cron Production Report',
    '',
    `**Date:** ${report.auditedAt.slice(0, 10)}`,
    `**Overall Status:** ${status}`,
    `**Production URL:** ${PRODUCTION_URL}`,
    `**Supabase Project:** ${report.supabaseProjectRef}`,
    '',
    '---',
    '',
    '## Summary',
    '',
    '| Check | Result |',
    '|-------|--------|',
    `| Migration 044 active | ${report.migration044.pass ? '✅ Pass' : '❌ Fail'} |`,
    `| RPC: acquire_cron_job_lock | ${report.migration044.rpcs.acquire_cron_job_lock ? '✅' : '❌'} |`,
    `| RPC: release_cron_job_lock | ${report.migration044.rpcs.release_cron_job_lock ? '✅' : '❌'} |`,
    `| RPC: claim_withdrawal_request | ${report.migration044.rpcs.claim_withdrawal_request ? '✅' : '❌'} |`,
    `| Production cron HTTP executed | ${report.cronExecution.attempted ? (report.cronExecution.pass ? '✅ Pass' : '❌ Fail') : '⏸ Not executed'} |`,
    `| All sub-jobs pass | ${report.cronExecution.allSubJobsPass ? '✅ Pass' : '❌ Fail / Not verified'} |`,
    `| Cron audit logs present | ${report.auditLogs.pass ? '✅ Pass' : '❌ Fail'} |`,
    `| No errors / failed jobs | ${report.noErrors ? '✅ Pass' : '❌ Fail'} |`,
    '',
  ]

  if (!report.cronExecution.attempted) {
    lines.push(
      '## Blocker',
      '',
      report.cronExecution.blocker ?? 'CRON_SECRET not available.',
      ''
    )
  }

  lines.push('## Migration 044 Verification', '', '```json', JSON.stringify(report.migration044, null, 2), '```', '')

  if (report.cronExecution.attempted) {
    lines.push(
      '## Production Cron Execution',
      '',
      `**HTTP Status:** ${report.cronExecution.httpStatus}`,
      `**Duration:** ${report.cronExecution.durationMs}ms`,
      '',
      '### Sub-jobs',
      ''
    )
    for (const [name, job] of Object.entries(report.cronExecution.subJobs ?? {})) {
      lines.push(`#### ${name}`, `- **Pass:** ${job.pass ? 'Yes' : 'No'}`, '```json', JSON.stringify(job.detail, null, 2), '```', '')
    }
  }

  lines.push('## Cron Audit Logs', '', '```json', JSON.stringify(report.auditLogs.entries, null, 2), '```', '')

  if (report.cronExecution.responseBody) {
    lines.push('## Full Cron Response', '', '```json', JSON.stringify(report.cronExecution.responseBody, null, 2), '```', '')
  }

  lines.push('---', '', '*Generated by `node scripts/verify-production-cron.mjs`*')
  return lines.join('\n')
}

async function main() {
  loadEnv()

  const reportPathArg = process.argv.indexOf('--report')
  const reportPath =
    reportPathArg >= 0 ? process.argv[reportPathArg + 1] : 'FINAL_CRON_PRODUCTION_REPORT.md'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const cronSecret = process.env.CRON_SECRET?.trim()
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? 'unknown'

  const report = {
    auditedAt: new Date().toISOString(),
    supabaseProjectRef: projectRef,
    migration044: { pass: false, rpcs: {}, tables: {} },
    cronExecution: {
      attempted: false,
      pass: false,
      blocker: null,
      httpStatus: null,
      durationMs: null,
      allSubJobsPass: false,
      subJobs: null,
      responseBody: null,
    },
    auditLogs: { pass: false, entries: [] },
    noErrors: false,
    overallPass: false,
  }

  if (!supabaseUrl || !serviceKey) {
    report.cronExecution.blocker = 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    fs.writeFileSync(path.join(ROOT, reportPath), buildMarkdown(report))
    console.error(report.cronExecution.blocker)
    process.exit(1)
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const acquire = await probeRpc(db, 'acquire_cron_job_lock', {
    p_job_name: 'verify_production_cron',
    p_owner: 'verify_script',
    p_ttl_seconds: 60,
  })
  if (acquire.present && !acquire.error) {
    await probeRpc(db, 'release_cron_job_lock', {
      p_job_name: 'verify_production_cron',
      p_owner: 'verify_script',
    })
  }

  const release = await probeRpc(db, 'release_cron_job_lock', {
    p_job_name: 'verify_production_cron',
    p_owner: 'verify_script',
  })
  const claim = await probeRpc(db, 'claim_withdrawal_request', {
    p_request_id: '00000000-0000-0000-0000-000000000000',
    p_target_status: 'ready',
  })

  report.migration044.rpcs = {
    acquire_cron_job_lock: acquire.present,
    release_cron_job_lock: release.present,
    claim_withdrawal_request: claim.present,
  }
  report.migration044.pass = Object.values(report.migration044.rpcs).every(Boolean)

  if (!cronSecret) {
    report.cronExecution.blocker =
      'CRON_SECRET is not configured in .env.local or environment. Add it from Vercel → Project → Settings → Environment Variables (Production), then re-run: CRON_SECRET=... node scripts/verify-production-cron.mjs'
  } else {
    report.cronExecution.attempted = true
    const started = Date.now()
    const url = `${PRODUCTION_URL}${CRON_PATH}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cronSecret}` },
      signal: AbortSignal.timeout(120000),
    })
    report.cronExecution.durationMs = Date.now() - started
    report.cronExecution.httpStatus = res.status

    let body = null
    try {
      body = await res.json()
    } catch {
      body = { error: 'Invalid JSON response' }
    }
    report.cronExecution.responseBody = body

    if (!res.ok) {
      report.cronExecution.pass = false
      report.cronExecution.blocker = `HTTP ${res.status}: ${body?.error ?? 'Request failed'}`
    } else {
      const validation = validateCronResponse(body)
      report.cronExecution.subJobs = validation.subJobs
      report.cronExecution.allSubJobsPass = validation.allSubJobsPass
      report.cronExecution.pass = validation.checks.httpOk && validation.allSubJobsPass && !body?.lockSkipped
    }
  }

  const { data: auditBefore } = await db
    .from('financial_audit_logs')
    .select('event_type, reference_id, created_at, metadata')
    .like('event_type', 'cron.%')
    .order('created_at', { ascending: false })
    .limit(20)

  report.auditLogs.entries = auditBefore ?? []
  report.auditLogs.pass =
    report.cronExecution.pass &&
    report.auditLogs.entries.some((row) =>
      ['cron.lock_acquired', 'cron.lock_released'].includes(String(row.event_type))
    )

  report.noErrors =
    report.migration044.pass &&
    report.cronExecution.pass &&
    report.cronExecution.allSubJobsPass &&
    !report.cronExecution.responseBody?.error &&
    !(report.cronExecution.responseBody?.withdrawals?.failed > 0)

  report.overallPass =
    report.migration044.pass &&
    report.cronExecution.attempted &&
    report.cronExecution.pass &&
    report.cronExecution.allSubJobsPass &&
    report.auditLogs.pass &&
    report.noErrors

  const markdown = buildMarkdown(report)
  fs.writeFileSync(path.join(ROOT, reportPath), markdown)

  console.log(JSON.stringify(report, null, 2))
  console.log(`\nReport written to ${reportPath}`)
  console.log(`Overall: ${report.overallPass ? 'SUCCESS' : 'FAIL'}`)

  process.exit(report.overallPass ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
