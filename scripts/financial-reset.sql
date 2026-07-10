-- =============================================================================
-- PrimeFx Invest — SAFE FINANCIAL RESET
-- =============================================================================
-- PURPOSE: Reset all financial state while preserving users, auth, KYC,
--          referrals (structure + ranks), admin accounts, support, and settings.
--
-- RUN AS:     service_role / database superuser (bypasses RLS)
-- WHEN:       Maintenance window — pause cron jobs first:
--               • /api/cron/daily
--               • /api/cron/daily-profits
--               • /api/cron/process-withdrawals
--               • /api/cron/weekly-commissions
--
-- SAFETY:     Wrapped in a single transaction — any error rolls back everything.
-- BACKUP:     Take a Supabase backup / PITR snapshot before running.
--
-- USAGE:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/financial-reset.sql
--   — or paste into Supabase SQL Editor (service role) —
-- =============================================================================

BEGIN;

-- ── Pre-flight snapshot (preserved counts for post-reset verification) ───────
CREATE TEMP TABLE _financial_reset_preflight ON COMMIT DROP AS
SELECT
  (SELECT COUNT(*)::BIGINT FROM users)              AS user_count,
  (SELECT COUNT(*)::BIGINT FROM referrals)          AS referral_count,
  (SELECT COUNT(*)::BIGINT FROM referral_network)   AS network_count,
  (SELECT COUNT(*)::BIGINT FROM kyc_submissions)    AS kyc_count,
  (SELECT COUNT(*)::BIGINT FROM verification_sessions) AS didit_session_count,
  (SELECT COUNT(*)::BIGINT FROM admin_profiles)     AS admin_count,
  (SELECT COUNT(*)::BIGINT FROM support_tickets)    AS support_ticket_count;

-- ── Release stale cron locks ─────────────────────────────────────────────────
DELETE FROM cron_job_locks;

-- ── Phase 1–5: Truncate all pure financial ledger / history tables ─────────
-- Single TRUNCATE handles FK ordering among listed tables.
TRUNCATE TABLE
  investment_profit_history,
  investment_daily_snapshots,
  investment_payouts,
  investment_withdrawal_requests,
  payment_webhook_logs,
  payments,
  withdrawal_requests,
  transactions,
  investments,
  investment_profit_runs,
  referral_commissions,
  referral_rank_rewards,
  platform_fee_ledger,
  financial_audit_logs,
  user_reward_redemptions
RESTART IDENTITY CASCADE;

-- ── Phase 6: Zero-out aggregate balances (keep one row per user) ─────────────
UPDATE wallet_balances
SET
  available_balance = 0,
  pending_balance   = 0,
  bonus_balance     = 0,
  total_balance     = 0,
  updated_at        = NOW();

UPDATE portfolios
SET
  total_invested = 0,
  current_value  = 0,
  profit_loss    = 0,
  roi_percentage = 0,
  updated_at     = NOW();

-- Referral relationships preserved; financial columns zeroed
UPDATE referrals
SET
  bonus_earned       = 0,
  welcome_bonus_paid = FALSE,
  status             = 'Active';

-- Referral rank + member counts preserved; commission earnings zeroed
UPDATE user_referral_stats
SET
  lifetime_commission_usd = 0,
  updated_at            = NOW();

UPDATE investment_plans
SET investor_count = 0;

-- ── Phase 7: Clear financial notifications ───────────────────────────────────
DELETE FROM user_notifications
WHERE type IN ('wallet', 'investment', 'payout', 'reward');

-- ── Phase 8: Ensure every user has wallet + portfolio rows at $0 ─────────────
INSERT INTO wallet_balances (user_id, available_balance, pending_balance, bonus_balance, total_balance)
SELECT u.id, 0, 0, 0, 0
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM wallet_balances w WHERE w.user_id = u.id
);

INSERT INTO portfolios (user_id, total_invested, current_value, profit_loss, roi_percentage)
SELECT u.id, 0, 0, 0, 0
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM portfolios p WHERE p.user_id = u.id
);

-- ── Post-reset verification (failure → automatic ROLLBACK) ─────────────────────
DO $$
DECLARE
  pre           RECORD;
  v_tx          BIGINT;
  v_inv         BIGINT;
  v_deposits    BIGINT;
  v_withdrawals BIGINT;
  v_transfers   BIGINT;
  v_wallet_sum  NUMERIC;
  v_port_invest NUMERIC;
  v_port_value  NUMERIC;
  v_profit_hist BIGINT;
  v_commissions BIGINT;
  v_profit_runs BIGINT;
  v_daily_snapshots BIGINT;
  v_capital_wd BIGINT;
  v_rank_rewards BIGINT;
  v_reward_redemptions BIGINT;
  v_webhook_logs BIGINT;
  v_pending_sum NUMERIC;
  v_bonus_sum NUMERIC;
  v_payments BIGINT;
BEGIN
  SELECT * INTO pre FROM _financial_reset_preflight LIMIT 1;

  SELECT COUNT(*) INTO v_tx FROM transactions;
  SELECT COUNT(*) INTO v_inv FROM investments;
  SELECT COUNT(*) INTO v_deposits FROM payments WHERE type = 'deposit';
  SELECT COUNT(*) INTO v_withdrawals FROM withdrawal_requests;
  SELECT COUNT(*) INTO v_transfers FROM transactions WHERE LOWER(type) = 'transfer';
  SELECT COALESCE(SUM(total_balance), 0) INTO v_wallet_sum FROM wallet_balances;
  SELECT COALESCE(SUM(total_invested), 0) INTO v_port_invest FROM portfolios;
  SELECT COALESCE(SUM(current_value), 0) INTO v_port_value FROM portfolios;
  SELECT COUNT(*) INTO v_profit_hist FROM investment_profit_history;
  SELECT COUNT(*) INTO v_commissions FROM referral_commissions;
  SELECT COUNT(*) INTO v_profit_runs FROM investment_profit_runs;
  SELECT COUNT(*) INTO v_daily_snapshots FROM investment_daily_snapshots;
  SELECT COUNT(*) INTO v_capital_wd FROM investment_withdrawal_requests;
  SELECT COUNT(*) INTO v_rank_rewards FROM referral_rank_rewards;
  SELECT COUNT(*) INTO v_reward_redemptions FROM user_reward_redemptions;
  SELECT COUNT(*) INTO v_webhook_logs FROM payment_webhook_logs;
  SELECT COUNT(*) INTO v_payments FROM payments;
  SELECT COALESCE(SUM(pending_balance), 0) INTO v_pending_sum FROM wallet_balances;
  SELECT COALESCE(SUM(bonus_balance), 0) INTO v_bonus_sum FROM wallet_balances;

  IF v_tx <> 0 THEN
    RAISE EXCEPTION 'Verify failed: transactions count = % (expected 0)', v_tx;
  END IF;
  IF v_inv <> 0 THEN
    RAISE EXCEPTION 'Verify failed: investments count = % (expected 0)', v_inv;
  END IF;
  IF v_deposits <> 0 THEN
    RAISE EXCEPTION 'Verify failed: deposits (payments) count = % (expected 0)', v_deposits;
  END IF;
  IF v_withdrawals <> 0 THEN
    RAISE EXCEPTION 'Verify failed: withdrawal_requests count = % (expected 0)', v_withdrawals;
  END IF;
  IF v_transfers <> 0 THEN
    RAISE EXCEPTION 'Verify failed: transfers count = % (expected 0)', v_transfers;
  END IF;
  IF v_wallet_sum <> 0 THEN
    RAISE EXCEPTION 'Verify failed: wallet total_balance sum = % (expected 0)', v_wallet_sum;
  END IF;
  IF v_port_invest <> 0 OR v_port_value <> 0 THEN
    RAISE EXCEPTION 'Verify failed: portfolio totals invested=%, value=% (expected 0)', v_port_invest, v_port_value;
  END IF;
  IF v_profit_hist <> 0 THEN
    RAISE EXCEPTION 'Verify failed: investment_profit_history count = % (expected 0)', v_profit_hist;
  END IF;
  IF v_commissions <> 0 THEN
    RAISE EXCEPTION 'Verify failed: referral_commissions count = % (expected 0)', v_commissions;
  END IF;
  IF v_profit_runs <> 0 THEN
    RAISE EXCEPTION 'Verify failed: investment_profit_runs count = % (expected 0)', v_profit_runs;
  END IF;
  IF v_daily_snapshots <> 0 THEN
    RAISE EXCEPTION 'Verify failed: investment_daily_snapshots count = % (expected 0)', v_daily_snapshots;
  END IF;
  IF v_capital_wd <> 0 THEN
    RAISE EXCEPTION 'Verify failed: investment_withdrawal_requests count = % (expected 0)', v_capital_wd;
  END IF;
  IF v_rank_rewards <> 0 THEN
    RAISE EXCEPTION 'Verify failed: referral_rank_rewards count = % (expected 0)', v_rank_rewards;
  END IF;
  IF v_reward_redemptions <> 0 THEN
    RAISE EXCEPTION 'Verify failed: user_reward_redemptions count = % (expected 0)', v_reward_redemptions;
  END IF;
  IF v_webhook_logs <> 0 THEN
    RAISE EXCEPTION 'Verify failed: payment_webhook_logs count = % (expected 0)', v_webhook_logs;
  END IF;
  IF v_payments <> 0 THEN
    RAISE EXCEPTION 'Verify failed: payments count = % (expected 0)', v_payments;
  END IF;
  IF v_pending_sum <> 0 THEN
    RAISE EXCEPTION 'Verify failed: wallet pending_balance sum = % (expected 0)', v_pending_sum;
  END IF;
  IF v_bonus_sum <> 0 THEN
    RAISE EXCEPTION 'Verify failed: wallet bonus_balance sum = % (expected 0)', v_bonus_sum;
  END IF;

  -- Preserved entity counts must be unchanged
  IF (SELECT COUNT(*) FROM users) <> pre.user_count THEN
    RAISE EXCEPTION 'Verify failed: user count changed (% → %)', pre.user_count, (SELECT COUNT(*) FROM users);
  END IF;
  IF (SELECT COUNT(*) FROM referrals) <> pre.referral_count THEN
    RAISE EXCEPTION 'Verify failed: referral count changed';
  END IF;
  IF (SELECT COUNT(*) FROM referral_network) <> pre.network_count THEN
    RAISE EXCEPTION 'Verify failed: referral_network count changed';
  END IF;
  IF (SELECT COUNT(*) FROM kyc_submissions) <> pre.kyc_count THEN
    RAISE EXCEPTION 'Verify failed: kyc_submissions count changed';
  END IF;
  IF (SELECT COUNT(*) FROM verification_sessions) <> pre.didit_session_count THEN
    RAISE EXCEPTION 'Verify failed: verification_sessions count changed';
  END IF;
  IF (SELECT COUNT(*) FROM admin_profiles) <> pre.admin_count THEN
    RAISE EXCEPTION 'Verify failed: admin_profiles count changed';
  END IF;
  IF (SELECT COUNT(*) FROM support_tickets) <> pre.support_ticket_count THEN
    RAISE EXCEPTION 'Verify failed: support_tickets count changed';
  END IF;

  RAISE NOTICE 'Financial reset verification passed.';
  RAISE NOTICE 'Users preserved: %', pre.user_count;
  RAISE NOTICE 'Referrals preserved: %', pre.referral_count;
  RAISE NOTICE 'Referral network preserved: %', pre.network_count;
END $$;

COMMIT;

-- =============================================================================
-- Post-commit: run scripts/verify-financial-reset.sql for read-only audit.
-- =============================================================================
