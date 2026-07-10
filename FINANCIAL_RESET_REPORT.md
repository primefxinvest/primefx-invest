# Financial Reset Report

**Date:** July 10, 2026  
**Operation:** Safe financial reset — all users returned to $0 fresh investor state  
**Script:** `scripts/financial-reset.sql`  
**Verification:** `scripts/verify-financial-reset.sql`

---

## Summary

A transactional SQL script resets **all financial data** across the platform while **fully preserving** user accounts, authentication, profiles, KYC, Didit sessions, referral structure, ranks, admin accounts, permissions, support messages, and platform settings.

The script runs inside a single PostgreSQL transaction. If any verification check fails, the entire operation rolls back automatically — no partial resets.

---

## Execution Instructions

### Prerequisites

1. **Backup** — Supabase point-in-time recovery or `pg_dump` before running.
2. **Pause crons** during the maintenance window:
   - `GET /api/cron/daily`
   - `GET /api/cron/daily-profits`
   - `GET /api/cron/process-withdrawals`
   - `GET /api/cron/weekly-commissions`
3. **Service role** — Run with database superuser or Supabase service role (bypasses RLS).

### Run

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/financial-reset.sql
```

Or paste `scripts/financial-reset.sql` into the Supabase SQL Editor.

### Post-run audit

```bash
psql "$DATABASE_URL" -f scripts/verify-financial-reset.sql
```

Re-enable cron jobs after verification passes.

---

## Tables Reset

### Fully truncated (all rows deleted)

| Table | Financial data cleared |
|-------|------------------------|
| `transactions` | All wallet transactions (deposits, withdrawals, transfers, profits, bonuses) |
| `payments` | Payment provider deposit/withdrawal records |
| `payment_webhook_logs` | Payment webhook payloads |
| `investments` | All investment positions |
| `investment_profit_history` | Daily / lifetime profit history |
| `investment_payouts` | Payout batch records |
| `investment_daily_snapshots` | Daily principal/profit snapshots |
| `investment_profit_runs` | Cron profit-run registry |
| `investment_withdrawal_requests` | Capital withdrawal queue |
| `withdrawal_requests` | Wallet withdrawal queue |
| `referral_commissions` | Accrued/paid referral commissions |
| `referral_rank_rewards` | Rank cash bonus payout queue |
| `platform_fee_ledger` | P2P transfer & withdrawal fees |
| `financial_audit_logs` | Financial event audit trail |
| `user_reward_redemptions` | Points redemption history |

### Zeroed out (rows preserved, columns reset to 0)

| Table | Columns reset |
|-------|---------------|
| `wallet_balances` | `available_balance`, `pending_balance`, `bonus_balance`, `total_balance` → 0 |
| `portfolios` | `total_invested`, `current_value`, `profit_loss`, `roi_percentage` → 0 |
| `referrals` | `bonus_earned` → 0, `welcome_bonus_paid` → false |
| `user_referral_stats` | `lifetime_commission_usd` → 0 |
| `investment_plans` | `investor_count` → 0 |

### Financial notifications deleted

| Table | Action |
|-------|--------|
| `user_notifications` | `DELETE WHERE type IN ('wallet', 'investment', 'payout', 'reward')` |

### Operational cleanup

| Table | Action |
|-------|--------|
| `cron_job_locks` | All rows deleted (prevents stale profit/withdrawal locks) |

### Missing rows backfilled

Users without wallet/portfolio rows receive zero-balance rows via `INSERT ... SELECT` (signup bootstrap parity).

---

## Tables Preserved

### Identity & authentication

| Table / Schema | Preserved |
|----------------|-----------|
| `auth.users` | ✅ Login credentials, emails, passwords (Supabase Auth) |
| `users` | ✅ Profile, avatar, country, referral_code, investor_tier, KYC status, admin flags |

### Verification & KYC

| Table | Preserved |
|-------|-----------|
| `kyc_submissions` | ✅ Full KYC records |
| `verification_sessions` | ✅ Didit sessions |
| `didit_webhook_logs` | ✅ Didit webhook audit |

### Referral structure & ranks

| Table | Preserved |
|-------|-----------|
| `referrals` | ✅ Referrer ↔ referred relationships |
| `referral_network` | ✅ Multi-level genealogy graph |
| `referral_rank_tiers` | ✅ Rank tier definitions (Bronze → Ambassador) |
| `user_referral_stats` | ✅ `rank_key`, `rank_achieved_at`, `active_member_count`, `total_member_count` |

### Admin & security

| Table | Preserved |
|-------|-----------|
| `admin_profiles` | ✅ Admin accounts & permissions |
| `admin_audit_logs` | ✅ Admin action history |
| `admin_display_ranks` | ✅ Cosmetic rank catalog |
| `security_audit_logs` | ✅ Security events |

### Support & platform

| Table | Preserved |
|-------|-----------|
| `support_tickets` | ✅ |
| `support_ticket_messages` | ✅ |
| `assistance_sessions` | ✅ |
| `assistance_messages` | ✅ |
| `support_agents` | ✅ |
| `platform_features` | ✅ Feature toggles |
| `platform_terms` | ✅ |
| `user_terms_acknowledgements` | ✅ |
| `investment_plans` | ✅ Plan definitions (counter zeroed only) |
| `user_preferences` | ✅ |
| `user_activity_logs` | ✅ |
| `payment_methods` | ✅ Saved payout methods |
| `chat_messages` | ✅ |
| `market_assets` / `market_insights` | ✅ |
| `academy_courses` / `academy_lessons` | ✅ |
| `user_courses` / `user_lesson_progress` | ✅ |
| `community_posts` | ✅ |
| `rewards_tiers` / `reward_catalog` | ✅ |
| `user_achievements` | ✅ |
| Non-financial `user_notifications` | ✅ (`general`, `security` types kept) |

---

## Rollback Strategy

| Scenario | Behavior |
|----------|----------|
| **Error during script** | PostgreSQL `ROLLBACK` — database unchanged |
| **Verification failure inside transaction** | `RAISE EXCEPTION` triggers automatic rollback |
| **Need to undo after COMMIT** | Restore from pre-reset backup / Supabase PITR — no in-script undo |

The script captures pre-flight counts (`users`, `referrals`, `kyc_submissions`, etc.) in a temp table and verifies they are unchanged before `COMMIT`.

---

## Verification Results

### In-transaction checks (automatic)

The script verifies before commit:

| Check | Expected |
|-------|----------|
| `transactions` count | 0 |
| `investments` count | 0 |
| `payments` (deposits) count | 0 |
| `withdrawal_requests` count | 0 |
| `transfers` count | 0 |
| `wallet_balances` sum | 0 |
| `portfolios` invested + value | 0 |
| `investment_profit_history` count | 0 |
| `referral_commissions` count | 0 |
| `users` count | unchanged |
| `referrals` count | unchanged |
| `referral_network` count | unchanged |
| `kyc_submissions` count | unchanged |
| `verification_sessions` count | unchanged |
| `admin_profiles` count | unchanged |
| `support_tickets` count | unchanged |

### Post-reset user state (expected)

Every investor should display:

| Metric | Value |
|--------|-------|
| Wallet | $0.00 |
| Portfolio | $0.00 |
| Total Profit | $0.00 |
| Total Invested | $0.00 |
| Active Investments | 0 |
| Transactions | 0 |
| Deposits | 0 |
| Withdrawals | 0 |
| Transfers | 0 |
| Investment History | Empty |
| Profit History | Empty |
| Analytics charts | Empty |

### Application build verification

| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | ✅ Pass — no application code modified |
| Production build (`npm run build`) | ✅ Pass |
| Authentication logic | ✅ Unchanged |
| Admin permissions | ✅ Unchanged |
| Business logic | ✅ Unchanged |
| UI / routing / translations | ✅ Unchanged |

### Database execution status

| Item | Status |
|------|--------|
| Script created | ✅ `scripts/financial-reset.sql` |
| Verification script | ✅ `scripts/verify-financial-reset.sql` |
| Live database execution | ⏳ **Pending** — requires manual run with service-role `DATABASE_URL` |

> **Note:** No `.env` database credentials are present in the workspace. The reset script is ready to run but must be executed manually against your Supabase instance during a maintenance window.

---

## Zero Regression Confirmation

| Constraint | Status |
|------------|--------|
| Users NOT deleted | ✅ Script never touches `users` or `auth.users` |
| Profiles NOT deleted | ✅ |
| KYC NOT deleted | ✅ |
| Didit sessions NOT deleted | ✅ |
| Referral tree NOT deleted | ✅ |
| Ranks NOT deleted | ✅ `rank_key` / member counts preserved |
| Admin accounts NOT deleted | ✅ |
| Permissions NOT modified | ✅ No application code changes |
| Business logic NOT modified | ✅ |
| UI NOT modified | ✅ |
| Transactional safety | ✅ Single `BEGIN`/`COMMIT` with verification |

---

## Manual QA Checklist (post-run)

- [ ] Log in as a test user — dashboard shows $0 wallet, $0 portfolio
- [ ] KYC status unchanged on profile
- [ ] Referral code and team tree still visible
- [ ] Referral rank badge still displayed (if previously earned)
- [ ] Admin portal loads; admin permissions unchanged
- [ ] Transaction history empty
- [ ] Support tickets and messages still accessible
- [ ] Re-enable cron jobs
