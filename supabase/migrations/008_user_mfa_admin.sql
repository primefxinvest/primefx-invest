-- Admin MFA bypass + audit fields on public.users

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mfa_disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mfa_disabled_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_users_mfa_disabled_at ON public.users(mfa_disabled_at)
  WHERE mfa_disabled_at IS NOT NULL;
