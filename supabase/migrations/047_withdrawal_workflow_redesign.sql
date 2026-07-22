-- Withdrawal workflow redesign: restore hold RPCs, extend columns, status transitions.
-- Fixes production bug where atomic_hold_wallet_funds was missing (submit always failed).

-- ---------------------------------------------------------------------------
-- Extend withdrawal_requests with exchange-style fields (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS coin VARCHAR(32),
  ADD COLUMN IF NOT EXISTS network VARCHAR(32),
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS wallet_label VARCHAR(128),
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(16),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_by UUID,
  ADD COLUMN IF NOT EXISTS tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill from existing columns / metadata
UPDATE withdrawal_requests
SET wallet_address = COALESCE(wallet_address, payout_address)
WHERE wallet_address IS NULL AND payout_address IS NOT NULL;

UPDATE withdrawal_requests
SET coin = COALESCE(coin, currency)
WHERE coin IS NULL AND currency IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status_requested
  ON withdrawal_requests (status, requested_at DESC);

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
-- Atomic wallet: release pending hold (withdrawal settled)
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
-- Atomic wallet: restore pending hold -> available (reject/cancel)
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
-- Atomic status transitions (prevent double approve / double mark-paid)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_withdrawal_status_transition(
  p_request_id UUID,
  p_from_statuses TEXT[],
  p_to_status VARCHAR,
  p_extra JSONB DEFAULT '{}'::jsonb
)
RETURNS withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request withdrawal_requests;
BEGIN
  UPDATE withdrawal_requests
  SET
    status = p_to_status,
    approved_at = CASE
      WHEN p_to_status = 'approved' THEN COALESCE(approved_at, NOW())
      ELSE approved_at
    END,
    completed_at = CASE
      WHEN p_to_status = 'completed' THEN COALESCE(completed_at, NOW())
      ELSE completed_at
    END,
    rejected_at = CASE
      WHEN p_to_status IN ('cancelled', 'failed') THEN COALESCE(rejected_at, NOW())
      ELSE rejected_at
    END,
    processed_at = CASE
      WHEN p_to_status IN ('completed', 'cancelled', 'failed') THEN COALESCE(processed_at, NOW())
      ELSE processed_at
    END,
    processed_by = COALESCE(
      NULLIF(p_extra->>'processed_by', '')::UUID,
      processed_by
    ),
    tx_hash = COALESCE(NULLIF(p_extra->>'tx_hash', ''), tx_hash),
    notes = COALESCE(NULLIF(p_extra->>'notes', ''), notes),
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_extra->'metadata', '{}'::jsonb)
  WHERE id = p_request_id
    AND status = ANY (p_from_statuses)
  RETURNING * INTO v_request;

  RETURN v_request;
END;
$$;

GRANT EXECUTE ON FUNCTION atomic_hold_wallet_funds(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_release_wallet_hold(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_restore_wallet_hold(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION claim_withdrawal_status_transition(UUID, TEXT[], VARCHAR, JSONB) TO service_role;

-- Realtime (safe if already added)
DO $$
BEGIN
  ALTER TABLE withdrawal_requests REPLICA IDENTITY FULL;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
