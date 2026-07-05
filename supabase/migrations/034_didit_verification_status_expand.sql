-- Expand Didit verification_status values for granular KYC lifecycle tracking

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_verification_status_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_verification_status_check
  CHECK (
    verification_status IN (
      'pending',
      'approved',
      'declined',
      'expired',
      'pending_review',
      'in_progress',
      'abandoned'
    )
  );
