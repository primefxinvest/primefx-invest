-- Signup bootstrap: link auth.users to public profile tables and auto-provision rows

-- Supabase Auth stores passwords; the app profile table should not store password_hash
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- One portfolio row per investor (idempotent signup bootstrap)
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_user_id_unique ON public.portfolios(user_id);

-- RLS policies for client-side profile updates when a session exists
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallet_balances;
CREATE POLICY "Users can insert own wallet" ON public.wallet_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own portfolio" ON public.portfolios;
CREATE POLICY "Users can insert own portfolio" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create public profile, wallet, and portfolio when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, investor_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'investor_tier', 'Starter')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
    investor_tier = COALESCE(NULLIF(EXCLUDED.investor_tier, ''), users.investor_tier),
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill existing auth users missing a public profile (run once after migration)
INSERT INTO public.users (id, email, full_name, investor_tier)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(COALESCE(au.email, ''), '@', 1)),
  COALESCE(au.raw_user_meta_data->>'investor_tier', 'Starter')
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallet_balances (user_id)
SELECT au.id
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.wallet_balances w WHERE w.user_id = au.id)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.portfolios (user_id)
SELECT au.id
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.portfolios p WHERE p.user_id = au.id);
