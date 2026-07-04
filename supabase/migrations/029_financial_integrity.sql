-- Financial Integrity Phase 1
-- Atomic wallet operations, deposit idempotency, cron locks, referral dedup, audit trail

-- ---------------------------------------------------------------------------
-- Financial audit log (service-role only writes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(64) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reference_id VARCHAR(100),
  amount_usd DECIMAL(15, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_event
  ON financial_audit_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_reference
  ON financial_audit_logs (reference_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_logs_user
  ON financial_audit_logs (user_id, created_at DESC);

ALTER TABLE financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Cron job locks (prevent overlapping executions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cron_job_locks (
  job_name VARCHAR(64) PRIMARY KEY,
  lock_owner TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cron_job_locks_expires ON cron_job_locks (expires_at);

-- ---------------------------------------------------------------------------
-- Referral commission idempotency (prevent duplicate accruals)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_commissions_profit_idempotency
  ON referral_commissions (referrer_id, source_user_id, period_start, period_end, level, commission_type)
  WHERE status IN ('pending', 'paid', 'paying');

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_commissions_ambassador_idempotency
  ON referral_commissions (referrer_id, period_start, period_end, commission_type)
  WHERE commission_type = 'ambassador_team' AND status IN ('pending', 'paid', 'paying');

-- ---------------------------------------------------------------------------
-- Atomic wallet: credit available + total
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atomic_credit_wallet(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance + p_amount,
    total_balance = total_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  RETURN v_wallet;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic wallet: debit available + total
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atomic_debit_wallet(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance - p_amount,
    total_balance = GREATEST(0, total_balance - p_amount),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND available_balance >= p_amount
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  RETURN v_wallet;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic wallet: move available -> pending (hold)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atomic_hold_wallet_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Hold amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance - p_amount,
    pending_balance = pending_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND available_balance >= p_amount
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  RETURN v_wallet;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic wallet: release pending hold (withdrawal settled — funds leave platform)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atomic_release_wallet_hold(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Release amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    pending_balance = pending_balance - p_amount,
    total_balance = GREATEST(0, total_balance - p_amount),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND pending_balance >= p_amount
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient pending balance';
  END IF;

  RETURN v_wallet;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic wallet: restore pending hold -> available (cancelled withdrawal)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atomic_restore_wallet_hold(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Restore amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance + p_amount,
    pending_balance = pending_balance - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND pending_balance >= p_amount
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient pending balance';
  END IF;

  RETURN v_wallet;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomically claim deposit completion (returns row only once)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_deposit_completion(p_order_id VARCHAR)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments;
BEGIN
  UPDATE payments
  SET
    status = 'completed',
    updated_at = NOW(),
    completed_at = NOW()
  WHERE order_id = p_order_id
    AND type = 'deposit'
    AND status IN ('pending', 'confirming', 'processing', 'created')
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomically claim profit run period (returns row only once)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_profit_run_period(
  p_period_start DATE,
  p_period_end DATE,
  p_trading_days SMALLINT
)
RETURNS investment_profit_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run investment_profit_runs;
BEGIN
  INSERT INTO investment_profit_runs (
    period_start,
    period_end,
    trading_days,
    total_profit_usd,
    status
  )
  VALUES (p_period_start, p_period_end, p_trading_days, 0, 'processing')
  ON CONFLICT (period_start, period_end) DO NOTHING
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

-- ---------------------------------------------------------------------------
-- Finalize profit run after processing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION finalize_profit_run_period(
  p_period_start DATE,
  p_period_end DATE,
  p_total_profit_usd DECIMAL
)
RETURNS investment_profit_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run investment_profit_runs;
BEGIN
  UPDATE investment_profit_runs
  SET
    total_profit_usd = p_total_profit_usd,
    status = 'completed'
  WHERE period_start = p_period_start
    AND period_end = p_period_end
    AND status = 'processing'
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomically claim withdrawal for processing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_withdrawal_request(p_request_id UUID, p_target_status VARCHAR)
RETURNS withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request withdrawal_requests;
BEGIN
  UPDATE withdrawal_requests
  SET status = p_target_status
  WHERE id = p_request_id
    AND status = 'pending_notice'
    AND available_at <= NOW()
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomically claim referral commission for payout
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_referral_commission_payout(
  p_commission_id UUID,
  p_reference_id VARCHAR
)
RETURNS referral_commissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row referral_commissions;
BEGIN
  UPDATE referral_commissions
  SET
    status = 'paying',
    reference_id = p_reference_id
  WHERE id = p_commission_id
    AND status = 'pending'
    AND commission_usd > 0
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomically claim rank bonus for payout
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_referral_rank_bonus_payout(p_reward_id UUID)
RETURNS referral_rank_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row referral_rank_rewards;
BEGIN
  UPDATE referral_rank_rewards
  SET status = 'paying'
  WHERE id = p_reward_id
    AND status = 'pending'
    AND cash_bonus_usd > 0
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- Cron lock acquire / release
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION acquire_cron_job_lock(
  p_job_name VARCHAR,
  p_owner TEXT,
  p_ttl_seconds INT DEFAULT 3600
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row cron_job_locks;
BEGIN
  DELETE FROM cron_job_locks WHERE expires_at < NOW();

  INSERT INTO cron_job_locks (job_name, lock_owner, expires_at)
  VALUES (p_job_name, p_owner, NOW() + make_interval(secs => p_ttl_seconds))
  ON CONFLICT (job_name) DO NOTHING
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN TRUE;
  END IF;

  UPDATE cron_job_locks
  SET
    lock_owner = p_owner,
    locked_at = NOW(),
    expires_at = NOW() + make_interval(secs => p_ttl_seconds)
  WHERE job_name = p_job_name
    AND expires_at < NOW()
  RETURNING * INTO v_row;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION release_cron_job_lock(p_job_name VARCHAR, p_owner TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM cron_job_locks
  WHERE job_name = p_job_name
    AND lock_owner = p_owner;
  RETURN FOUND;
END;
$$;

-- Allow service role to execute all integrity functions
GRANT EXECUTE ON FUNCTION atomic_credit_wallet(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_debit_wallet(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_hold_wallet_funds(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_release_wallet_hold(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_restore_wallet_hold(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION claim_deposit_completion(VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION claim_profit_run_period(DATE, DATE, SMALLINT) TO service_role;
GRANT EXECUTE ON FUNCTION finalize_profit_run_period(DATE, DATE, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION claim_withdrawal_request(UUID, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION claim_referral_commission_payout(UUID, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION claim_referral_rank_bonus_payout(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION acquire_cron_job_lock(VARCHAR, TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION release_cron_job_lock(VARCHAR, TEXT) TO service_role;
