-- =============================================================================
-- Restore cron lock + withdrawal claim RPCs (idempotent)
-- Safe to re-run if migration 029 was not fully applied to production.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cron_job_locks (
  job_name VARCHAR(64) PRIMARY KEY,
  lock_owner TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cron_job_locks_expires ON cron_job_locks (expires_at);

CREATE TABLE IF NOT EXISTS financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(80) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reference_id VARCHAR(120),
  amount_usd DECIMAL(18, 2),
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

GRANT EXECUTE ON FUNCTION claim_withdrawal_request(UUID, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION acquire_cron_job_lock(VARCHAR, TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION release_cron_job_lock(VARCHAR, TEXT) TO service_role;
