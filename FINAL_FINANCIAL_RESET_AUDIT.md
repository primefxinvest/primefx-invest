# Final Financial Reset Audit

**Date:** 2026-07-10  
**Platform:** PrimeFx Invest  
**Scope:** Finance-only reset — preserve users, auth, KYC, referrals, admin, settings

---

## Executive Summary

The financial reset tooling is **ready for execution**. Automated verification is built into the reset script (transaction rolls back on failure). A standalone audit runner is available for post-reset validation.

| Item | Status |
|------|--------|
| Reset SQL script | ✅ Ready — `scripts/financial-reset.sql` |
| Read-only verify SQL | ✅ Ready — `scripts/verify-financial-reset.sql` |
| Automated audit runner | ✅ Ready — `scripts/run-financial-reset-audit.mjs` |
| Live DB execution | ⏸ Pending — `DATABASE_URL` not set in this environment |

---

## What Gets Reset (Finance Only)

| Category | Tables / Fields |
|----------|-----------------|
| Wallet balances | `wallet_balances` → all columns zeroed |
| Wallet ledger | `transactions` (truncated) |
| Deposits | `payments` (type deposit), `payment_webhook_logs` |
| Withdrawals | `withdrawal_requests`, `investment_withdrawal_requests` |
| Investments | `investments`, `investment_payouts`, `investment_profit_history`, `investment_daily_snapshots`, `investment_profit_runs` |
| Profit history | All profit/snapshot tables above |
| Referral earnings | `referral_commissions`, `referral_rank_rewards` |
| Rewards | `user_reward_redemptions` |
| Fees / audit | `platform_fee_ledger`, `financial_audit_logs` |
| Aggregates | `portfolios` zeroed, `referrals.bonus_earned` zeroed, `user_referral_stats.lifetime_commission_usd` zeroed |
| Financial notifications | `user_notifications` where type ∈ wallet, investment, payout, reward |
| Cron locks | `cron_job_locks` cleared |

---

## What Is Preserved (Non-Financial)

| Category | Preserved |
|----------|-----------|
| Users & profiles | ✅ `users`, auth credentials, emails |
| KYC | ✅ `kyc_submissions`, `verification_sessions`, Didit logs |
| Referral structure | ✅ `referrals`, `referral_network`, `referral_rank_tiers`, rank keys |
| Referral codes | ✅ Unchanged |
| Admin | ✅ `admin_profiles`, permissions |
| Support | ✅ `support_tickets`, `assistance_sessions` |
| Settings | ✅ `platform_features`, investment plan definitions (counts zeroed) |

---

## Post-Reset Expected State (Per User)

| Metric | Expected |
|--------|----------|
| Wallet | $0 |
| Portfolio | $0 |
| Profit | $0 |
| Investments | 0 |
| Transactions | 0 |
| Deposits | 0 |
| Withdrawals | 0 |
| Transfers | 0 |
| Referral earnings | $0 |
| Leaderboard earnings | Reset (commission columns zeroed) |

---

## Built-In Verification (Inside Reset Transaction)

`scripts/financial-reset.sql` runs these checks **before COMMIT**. Any failure triggers **automatic ROLLBACK**:

- `transactions` = 0
- `investments` = 0
- `payments` (deposits) = 0
- `withdrawal_requests` = 0
- `transfers` = 0
- `wallet_balances` sum = 0
- `portfolios` invested/value = 0
- `investment_profit_history` = 0
- `referral_commissions` = 0
- `investment_profit_runs` = 0
- `investment_daily_snapshots` = 0
- `investment_withdrawal_requests` = 0
- `referral_rank_rewards` = 0
- `user_reward_redemptions` = 0
- `payment_webhook_logs` = 0
- `payments` (all) = 0
- `pending_balance` sum = 0
- `bonus_balance` sum = 0
- User/referral/KYC/admin/support counts **unchanged**

---

## Execution Instructions

### Prerequisites

1. **Maintenance window** — pause cron routes:
   - `/api/cron/daily`
   - `/api/cron/daily-profits`
   - `/api/cron/process-withdrawals`
   - `/api/cron/weekly-commissions`
2. **Backup** — Supabase PITR snapshot or manual backup
3. **Service role** — run as database superuser or `service_role`

### Option A — psql

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/financial-reset.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/verify-financial-reset.sql
```

### Option B — Automated runner

```bash
# Verify only (read-only)
DATABASE_URL=postgresql://... node scripts/run-financial-reset-audit.mjs

# Execute reset + verify (loops until clean)
DATABASE_URL=postgresql://... node scripts/run-financial-reset-audit.mjs --execute
```

---

## Verification Run (This Environment)

```
DATABASE_URL is not set — verification queries were not executed against a database.
Review scripts/financial-reset.sql and scripts/verify-financial-reset.sql manually.
```

**Action required:** Run the scripts against production/staging Supabase with `DATABASE_URL` before go-live.

---

## Audit Checklist

| Check | Script | Pass Criteria |
|-------|--------|---------------|
| Zero transactions | verify SQL | count = 0 |
| Zero payments | verify SQL | count = 0 |
| Zero withdrawals | verify SQL | count = 0 |
| Zero investments | verify SQL | count = 0 |
| Zero profit history | verify SQL | count = 0 |
| Zero commissions | verify SQL | count = 0 |
| Wallet sums | verify SQL | all = 0 |
| Portfolio sums | verify SQL | all = 0 |
| Users preserved | reset SQL preflight | count unchanged |
| Referrals preserved | reset SQL preflight | count unchanged |
| KYC preserved | reset SQL preflight | count unchanged |

---

## Sign-Off

| Role | Status |
|------|--------|
| Reset script reviewed | ✅ |
| Verification queries reviewed | ✅ |
| Preserved-entity guards verified | ✅ |
| Live DB execution | ⏸ Awaiting `DATABASE_URL` |

---

*Generated as part of the PrimeFx Invest platform hardening initiative.*
