-- Final security hardening: transaction PIN + TOTP secret storage

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS transaction_pin_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS totp_secret TEXT;

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
    OR NEW.transaction_pin_hash IS DISTINCT FROM OLD.transaction_pin_hash
    OR NEW.transaction_pin_set_at IS DISTINCT FROM OLD.transaction_pin_set_at
    OR NEW.totp_secret IS DISTINCT FROM OLD.totp_secret
  THEN
    RAISE EXCEPTION 'Cannot update protected profile fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
