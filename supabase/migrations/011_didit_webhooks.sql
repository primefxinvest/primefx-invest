-- Didit identity verification webhooks (idempotency + session linkage)

CREATE TABLE IF NOT EXISTS public.didit_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL UNIQUE,
  webhook_type VARCHAR(80) NOT NULL,
  session_id VARCHAR(120),
  transaction_id VARCHAR(120),
  status VARCHAR(80),
  payload JSONB NOT NULL,
  signature_method VARCHAR(20),
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_didit_webhook_logs_session
  ON public.didit_webhook_logs(session_id, webhook_type, status);
CREATE INDEX IF NOT EXISTS idx_didit_webhook_logs_created_at
  ON public.didit_webhook_logs(created_at DESC);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS didit_session_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS kyc_verification_detail VARCHAR(50);

ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS didit_session_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS didit_decision JSONB,
  ADD COLUMN IF NOT EXISTS didit_resubmit_info JSONB;

CREATE INDEX IF NOT EXISTS idx_users_didit_session_id ON public.users(didit_session_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_didit_session_id ON public.kyc_submissions(didit_session_id);

ALTER TABLE public.didit_webhook_logs ENABLE ROW LEVEL SECURITY;
