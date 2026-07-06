-- Universal referral access: all existing and future users may use the referral program.

ALTER TABLE public.users
  ALTER COLUMN referral_access_enabled SET DEFAULT TRUE;

UPDATE public.users
SET
  referral_access_enabled = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE referral_access_enabled IS DISTINCT FROM TRUE;

INSERT INTO platform_features (key, enabled, updated_at)
VALUES ('referral_program', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO UPDATE SET
  enabled = TRUE,
  updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, investor_tier, referral_access_enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'investor_tier', 'Starter'),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
    investor_tier = COALESCE(NULLIF(EXCLUDED.investor_tier, ''), users.investor_tier),
    referral_access_enabled = TRUE,
    updated_at = CURRENT_TIMESTAMP;

  INSERT INTO public.wallet_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.portfolios WHERE user_id = NEW.id) THEN
    INSERT INTO public.portfolios (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;
