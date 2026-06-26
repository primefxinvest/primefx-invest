-- KYC document submissions for investor identity verification

CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  id_type VARCHAR(50) NOT NULL,
  id_number VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  document_front_path TEXT NOT NULL,
  document_back_path TEXT,
  selfie_path TEXT NOT NULL,
  proof_of_address_path TEXT,
  review_status VARCHAR(50) NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_submissions_review_status ON public.kyc_submissions(review_status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_submitted_at ON public.kyc_submissions(submitted_at DESC);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own kyc submission" ON public.kyc_submissions;
CREATE POLICY "Users read own kyc submission" ON public.kyc_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Inserts/updates go through service role in server actions

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own KYC documents" ON storage.objects;
CREATE POLICY "Users upload own KYC documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own KYC documents" ON storage.objects;
CREATE POLICY "Users update own KYC documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read own KYC documents" ON storage.objects;
CREATE POLICY "Users read own KYC documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
