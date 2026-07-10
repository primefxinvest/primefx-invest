-- Atomic signup bootstrap: verify auth.users exists before inserting public profile rows.
-- Fixes production users_id_fkey violations when bootstrap runs before auth.users is visible.

CREATE OR REPLACE FUNCTION public.bootstrap_user_profile_atomic(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_investor_tier TEXT DEFAULT 'Starter'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_exists BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_USER_ID');
  END IF;

  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO auth_exists;
  IF NOT auth_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'AUTH_USER_NOT_FOUND');
  END IF;

  INSERT INTO public.users (id, email, full_name, investor_tier, referral_access_enabled)
  VALUES (
    p_user_id,
    p_email,
    p_full_name,
    COALESCE(NULLIF(p_investor_tier, ''), 'Starter'),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
    investor_tier = COALESCE(NULLIF(EXCLUDED.investor_tier, ''), users.investor_tier),
    updated_at = CURRENT_TIMESTAMP;

  INSERT INTO public.wallet_balances (user_id, available_balance, pending_balance, bonus_balance, total_balance)
  VALUES (p_user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.portfolios WHERE user_id = p_user_id) THEN
    INSERT INTO public.portfolios (user_id) VALUES (p_user_id);
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'AUTH_USER_NOT_FOUND');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_user_profile_atomic(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_user_profile_atomic(UUID, TEXT, TEXT, TEXT) TO service_role;
