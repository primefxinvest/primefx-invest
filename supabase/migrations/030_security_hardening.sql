-- Security Hardening Phase: RLS guards, rate limiting, audit logs

CREATE OR REPLACE FUNCTION enforce_users_self_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt()->>'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> OLD.id THEN
    RETURN NEW;
  END IF;

  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
    OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
    OR NEW.kyc_level IS DISTINCT FROM OLD.kyc_level
    OR NEW.kyc_rejection_reason IS DISTINCT FROM OLD.kyc_rejection_reason
    OR NEW.kyc_submitted_at IS DISTINCT FROM OLD.kyc_submitted_at
    OR NEW.kyc_verification_detail IS DISTINCT FROM OLD.kyc_verification_detail
    OR NEW.didit_session_id IS DISTINCT FROM OLD.didit_session_id
    OR NEW.investor_tier IS DISTINCT FROM OLD.investor_tier
    OR NEW.account_status IS DISTINCT FROM OLD.account_status
    OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
    OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
    OR NEW.mfa_disabled_at IS DISTINCT FROM OLD.mfa_disabled_at
    OR NEW.mfa_disabled_reason IS DISTINCT FROM OLD.mfa_disabled_reason
    OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
    OR NEW.referral_access_enabled IS DISTINCT FROM OLD.referral_access_enabled
    OR NEW.email IS DISTINCT FROM OLD.email
  THEN
    RAISE EXCEPTION 'Cannot update protected profile fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_self_update_guard ON public.users;
CREATE TRIGGER trg_users_self_update_guard
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_users_self_update_guard();

CREATE OR REPLACE FUNCTION enforce_wallet_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt()->>'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF coalesce(NEW.available_balance, 0) <> 0
    OR coalesce(NEW.pending_balance, 0) <> 0
    OR coalesce(NEW.bonus_balance, 0) <> 0
    OR coalesce(NEW.total_balance, 0) <> 0
  THEN
    RAISE EXCEPTION 'Cannot create wallet with non-zero balance'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_insert_guard ON public.wallet_balances;
CREATE TRIGGER trg_wallet_insert_guard
  BEFORE INSERT ON public.wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION enforce_wallet_insert_guard();

DROP POLICY IF EXISTS "Users create own redemptions" ON public.user_reward_redemptions;

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  hit_count INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window ON rate_limit_buckets (window_start);

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_bucket_key TEXT,
  p_max_hits INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_row rate_limit_buckets;
BEGIN
  SELECT * INTO v_row
  FROM rate_limit_buckets
  WHERE bucket_key = p_bucket_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO rate_limit_buckets (bucket_key, hit_count, window_start)
    VALUES (p_bucket_key, 1, v_now);
    RETURN TRUE;
  END IF;

  IF v_row.window_start + make_interval(secs => p_window_seconds) < v_now THEN
    UPDATE rate_limit_buckets
    SET hit_count = 1, window_start = v_now
    WHERE bucket_key = p_bucket_key;
    RETURN TRUE;
  END IF;

  IF v_row.hit_count >= p_max_hits THEN
    RETURN FALSE;
  END IF;

  UPDATE rate_limit_buckets
  SET hit_count = hit_count + 1
  WHERE bucket_key = p_bucket_key;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INT, INT) TO service_role;

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(64) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_id UUID,
  resource_id VARCHAR(120),
  ip_address TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event
  ON security_audit_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user
  ON security_audit_logs (user_id, created_at DESC);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION enforce_users_self_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt()->>'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> NEW.id THEN
    RETURN NEW;
  END IF;

  IF coalesce(NEW.is_verified, false) <> false
    OR NEW.verified_at IS NOT NULL
    OR coalesce(NEW.verification_status, 'pending') <> 'pending'
    OR coalesce(NEW.kyc_status, 'Pending') <> 'Pending'
    OR NEW.kyc_level IS NOT NULL
    OR NEW.didit_session_id IS NOT NULL
    OR coalesce(NEW.investor_tier, 'Starter') <> 'Starter'
    OR coalesce(NEW.account_status, 'active') <> 'active'
    OR NEW.referral_code IS NOT NULL
    OR coalesce(NEW.referral_access_enabled, true) <> true
  THEN
    RAISE EXCEPTION 'Cannot insert profile with privileged fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_self_insert_guard ON public.users;
CREATE TRIGGER trg_users_self_insert_guard
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION enforce_users_self_insert_guard();
