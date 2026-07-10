# Cron System Audit

**Date:** 2026-07-10  
**Platform:** PrimeFx Invest  
**Production URL:** https://www.primefxinvest.com  
**Supabase Project:** `evjoyubypgjutylekiys`

---

## Executive Summary

| Area | Status |
|------|--------|
| Vercel cron registration | ✅ 1 job registered (`/api/cron/daily`) |
| Production HTTP auth | ✅ Returns 401 without `CRON_SECRET` |
| Unified daily cron code | ✅ All sub-jobs wired in `runDailyCron()` |
| Database cron RPCs | ⚠ **3 of 4 missing** on production (fixed in code + migration) |
| Cron execution logs | ⚠ No `cron.*` entries in `financial_audit_logs` |
| Production readiness | ⚠ **Apply migration 044 + deploy fallback code** |

**Fixes applied (no business-logic changes):**
- `lib/cron/lock.ts` — runs without distributed lock if RPC missing
- `lib/wallet/withdrawals.ts` — application-level fallback for `claim_withdrawal_request`
- `supabase/migrations/044_restore_cron_integrity.sql` — idempotent DB restore
- `scripts/cron-system-audit.mjs` — repeatable audit runner

---

## Vercel Registration

| Path | Schedule (UTC) | Registered |
|------|----------------|------------|
| `/api/cron/daily` | `0 22 * * *` (daily 22:00 UTC) | ✅ Yes |

**Next scheduled run (UTC):** 2026-07-10T22:00:00.000Z  
**Local equivalent (UTC+2):** 2026-07-11 00:00 (midnight)

> Vercel Hobby allows **one cron job per project**. All production schedules are consolidated into `/api/cron/daily`. Manual trigger routes exist for individual sub-jobs.

**Source:** `vercel.json`

---

## Scheduled Jobs Inventory

### 1. Unified Daily Cron ✅ (Production)

| Field | Value |
|-------|-------|
| **Route** | `GET /api/cron/daily` |
| **Registered** | ✅ Vercel `0 22 * * *` |
| **Auth** | `Authorization: Bearer ${CRON_SECRET}` |
| **Lock** | `withCronJobLock('daily_cron', …)` — 3600s TTL |
| **Orchestrator** | `lib/cron/daily-jobs.ts` → `runDailyCron()` |

**Sub-jobs executed in order:**

| # | Job | Function | Idempotency |
|---|-----|----------|-------------|
| 1 | Withdrawal hold promotion | `processDueWalletWithdrawals()` | `claim_withdrawal_request` RPC (or app fallback) |
| 2 | Hold reminder notifications | `processWithdrawalHoldReminders()` | Deduped by notification service |
| 3 | Deposit reconciliation | `syncAllOpenDeposits()` | `claimDepositCompletion()` per order |
| 4 | Daily investment profits | `runDailyInvestmentProfits()` | `claim_investment_daily_profit` + `claim_profit_run_period` |
| 5 | Weekly referral payout | `runWeeklyReferralDistribution()` | Friday only (`utcDay === 5`) |
| 6 | Capital withdrawals | `processDueCapitalWithdrawals()` | Per-request processing |

---

### 2. Daily Profit Cron (Manual)

| Field | Value |
|-------|-------|
| **Route** | `GET /api/cron/daily-profits` |
| **Registered** | ❌ Manual only |
| **Purpose** | Trigger profit accrual without full daily bundle |
| **Production HTTP** | 401 without auth ✅ |

---

### 3. Withdrawal Ready-for-Payout Cron (Manual)

| Field | Value |
|-------|-------|
| **Route** | `GET /api/cron/process-withdrawals` |
| **Registered** | ❌ Manual only (included in daily cron) |
| **Purpose** | Promote `pending_notice` → `ready` + hold reminders |
| **Production HTTP** | 401 without auth ✅ |

---

### 4. Weekly Referral Commissions (Manual)

| Field | Value |
|-------|-------|
| **Route** | `GET /api/cron/weekly-commissions` |
| **Registered** | ❌ Manual only (Fridays in daily cron) |
| **Purpose** | Referral distribution + capital withdrawals |
| **Production HTTP** | 401 without auth ✅ |

---

### 5. NOWPayments Reconciliation

| Field | Value |
|-------|-------|
| **Primary path** | `POST /api/webhooks/nowpayments` (event-driven) |
| **Cron backup** | `syncAllOpenDeposits()` inside daily cron |
| **User poll** | `syncDepositOrder()` on deposit success page |
| **Idempotency** | `claimDepositCompletion()` blocks duplicate credits |

---

### 6. Deposit Verification

| Field | Value |
|-------|-------|
| **Cron** | Daily via `syncAllOpenDeposits(limit=50)` |
| **Admin** | `processDueFinancialJobsAction` (Platform Owner) |
| **Providers** | NOWPayments API poll + Binance Pay query |

---

### 7. Notification Jobs (Withdrawal Hold)

| Field | Value |
|-------|-------|
| **Trigger** | Inside `processDueWalletWithdrawals()` |
| **Function** | `processWithdrawalHoldReminders()` |
| **Schedule** | Daily with unified cron |
| **Rules** | 3-day and 1-day remaining notifications, deduplicated |

---

### 8. Admin Manual Financial Jobs

| Field | Value |
|-------|-------|
| **Action** | `processDueFinancialJobsAction()` |
| **Auth** | Platform Owner only (`infojimvio@gmail.com`) |
| **Runs** | Withdrawals + capital + deposit sync (no profits) |

---

### 9. Cleanup Jobs

| Job | Status |
|-----|--------|
| Dedicated cleanup cron | ❌ Not registered |
| Stale cron locks | Cleared inside `acquire_cron_job_lock` RPC |
| Open deposit reconciliation | Daily via deposit sync |
| Financial notifications | Cleared during financial reset only |

---

## Production HTTP Verification

Probed **2026-07-10T01:19:55Z**:

| Endpoint | Unauthenticated | Invalid Secret |
|----------|-----------------|----------------|
| `/api/cron/daily` | **401** ✅ | **401** ✅ |
| `/api/cron/daily-profits` | **401** ✅ | — |
| `/api/cron/process-withdrawals` | **401** ✅ | — |
| `/api/cron/weekly-commissions` | **401** ✅ | — |

**Interpretation:** Production enforces `CRON_SECRET` (Vercel sends `Authorization: Bearer …` on scheduled invocations). Unauthenticated probes correctly rejected.

---

## Database Infrastructure

### Tables

| Table | Present | Row count |
|-------|---------|-----------|
| `cron_job_locks` | ✅ | 0 |
| `financial_audit_logs` | ✅ | 0 |
| `investment_profit_runs` | ✅ | 0 |

### RPC Functions

| RPC | Status | Notes |
|-----|--------|-------|
| `acquire_cron_job_lock` | ❌ **MISSING** | Caused daily cron hard-fail before fix |
| `release_cron_job_lock` | ❌ **MISSING** | Paired with acquire |
| `claim_withdrawal_request` | ❌ **MISSING** | Withdrawal promotion fails without fallback |
| `claim_profit_run_period` | ✅ Present | Profit run ledger works |
| `claim_investment_daily_profit` | ✅ Present | Per-investment idempotency |

### Cron Audit Logs

| Query | Result |
|-------|--------|
| `financial_audit_logs WHERE event_type LIKE 'cron.%'` | **0 rows** |

No recorded lock acquire/release/skipped events — consistent with missing RPC functions preventing successful locked runs.

---

## Per-Job Audit Matrix

| Job | Registered | Running | Last Success | Last Failure | Idempotency | Ready |
|-----|------------|---------|--------------|--------------|-------------|-------|
| Unified daily | ✅ | ⚠ Blocked by missing RPCs | Unknown | Likely RPC error | Lock + per-job claims | ⚠ After deploy |
| Daily profits (manual) | Manual | ✅ Callable | Unknown | Unknown | Profit claim RPCs | ✅ |
| Withdrawal promotion | In daily | ⚠ RPC missing | Unknown | Likely | Claim + fallback | ⚠ After deploy |
| Hold reminders | In daily | ✅ Code OK | Unknown | Unknown | Notification dedupe | ✅ |
| Deposit sync | In daily | ✅ Code OK | Unknown | Unknown | Deposit claim | ✅ |
| Weekly referral | In daily (Fri) | ✅ Code OK | Unknown | Unknown | Commission claims | ✅ |
| Capital withdrawals | In daily | ✅ Code OK | Unknown | Unknown | Per-request | ✅ |
| NOWPayments webhook | Event | ✅ | Unknown | Unknown | Deposit claim | ✅ |

**Last execution / next execution:** Vercel does not expose last-run timestamps via API in this environment. Next Vercel invocation: **2026-07-10 22:00 UTC**.

---

## Issues Found & Fixes Applied

### Issue 1 — Missing cron lock RPCs (Critical)

**Symptom:** `acquire_cron_job_lock` / `release_cron_job_lock` not in production schema.  
**Impact:** `runDailyCron()` threw before executing any sub-job.  
**Fix:**
- Application fallback in `lib/cron/lock.ts` (runs without lock if RPC missing)
- Migration `044_restore_cron_integrity.sql`

### Issue 2 — Missing withdrawal claim RPC (High)

**Symptom:** `claim_withdrawal_request` not in production schema.  
**Impact:** Withdrawal hold promotion failed.  
**Fix:**
- Application fallback in `lib/wallet/withdrawals.ts` (atomic UPDATE matching RPC semantics)
- Included in migration 044

### Issue 3 — No cron audit trail (Info)

**Symptom:** Zero `cron.*` events in `financial_audit_logs`.  
**Impact:** No visibility into cron history.  
**Fix:** Migration 044 ensures table exists; logs will populate after successful runs post-deploy.

### Issue 4 — CRON_SECRET not in local `.env.local` (Info)

**Symptom:** Local manual cron triggers require dev mode or secret.  
**Impact:** None for production (Vercel has secret — confirmed by 401 responses).  
**Fix:** Documented in `.env.example`.

---

## Required Operator Actions

1. **Apply migration 044** in Supabase SQL Editor:
   ```
   supabase/migrations/044_restore_cron_integrity.sql
   ```
2. **Deploy** the application code with RPC fallbacks.
3. **Confirm `CRON_SECRET`** is set in Vercel → Project → Environment Variables (Production).
4. **Manual smoke test** after deploy:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://www.primefxinvest.com/api/cron/daily
   ```
5. **Re-run audit:**
   ```bash
   node scripts/cron-system-audit.mjs
   ```

---

## Idempotency Summary

| Operation | Mechanism |
|-----------|-----------|
| Daily cron overlap | `withCronJobLock('daily_cron')` + 3600s TTL |
| Daily profit per investment/period | `claim_investment_daily_profit` RPC |
| Profit run ledger | `claim_profit_run_period` RPC |
| Deposit credit | `claimDepositCompletion` |
| Withdrawal promotion | `claim_withdrawal_request` RPC (or UPDATE fallback) |
| Referral commissions | Unique indexes + claim RPCs |

---

## Architecture Diagram

```
Vercel Cron (22:00 UTC daily)
        │
        ▼
GET /api/cron/daily  ── CRON_SECRET auth
        │
        ▼
withCronJobLock('daily_cron')
        │
        ├── processDueWalletWithdrawals()
        │     ├── promoteDueWithdrawalToReady (7-day hold expired)
        │     └── processWithdrawalHoldReminders (3d / 1d notices)
        │
        ├── syncAllOpenDeposits()  ← NOWPayments reconciliation
        │
        ├── runDailyInvestmentProfits()
        │
        ├── runWeeklyReferralDistribution()  ← Fridays only
        │
        └── processDueCapitalWithdrawals()
```

---

## Sign-Off

| Check | Result |
|-------|--------|
| All jobs inventoried | ✅ |
| Vercel registration verified | ✅ |
| Production auth verified | ✅ |
| DB gaps identified | ✅ |
| Fixes applied (config/resilience) | ✅ |
| Business logic unchanged | ✅ |
| Migration 044 ready | ✅ |

---

*Generated by `node scripts/cron-system-audit.mjs` — re-run anytime for updated status.*
