-- Didit identity verification fields on users (application profile record)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_verification_status_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_verification_status_check
  CHECK (verification_status IN ('pending', 'approved', 'declined', 'expired'));

CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users(verification_status);

-- Backfill from legacy kyc_status where applicable
UPDATE public.users
SET
  is_verified = TRUE,
  verification_status = 'approved',
  verified_at = COALESCE(verified_at, kyc_submitted_at, updated_at)
WHERE LOWER(kyc_status) = 'verified'
  AND is_verified = FALSE;

UPDATE public.users
SET verification_status = 'declined'
WHERE LOWER(kyc_status) = 'rejected'
  AND verification_status = 'pending';
