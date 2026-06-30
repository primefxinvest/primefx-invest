-- Didit verification session registry for admin portal
CREATE TABLE IF NOT EXISTS verification_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(120) NOT NULL UNIQUE,
  vendor_data VARCHAR(255),
  status VARCHAR(80) NOT NULL DEFAULT 'Not Started',
  decision JSONB,
  workflow_id VARCHAR(120),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON verification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_vendor_data ON verification_sessions(vendor_data);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_created_at ON verification_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_id ON verification_sessions(user_id);

ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;

-- Backfill from existing Didit-linked users
INSERT INTO verification_sessions (
  session_id,
  vendor_data,
  status,
  decision,
  user_id,
  created_at,
  updated_at
)
SELECT
  u.didit_session_id,
  u.id::text,
  CASE
    WHEN u.verification_status = 'approved' THEN 'Approved'
    WHEN u.verification_status = 'declined' THEN 'Declined'
    WHEN u.kyc_verification_detail = 'in_review' THEN 'In Review'
    WHEN u.kyc_verification_detail = 'in_progress' THEN 'In Progress'
    WHEN u.kyc_verification_detail = 'abandoned' THEN 'Abandoned'
    WHEN u.verification_status = 'expired' THEN 'Expired'
    ELSE 'Not Started'
  END,
  ks.didit_decision,
  u.id,
  COALESCE(ks.submitted_at, u.kyc_submitted_at, u.created_at, NOW()),
  COALESCE(u.updated_at, NOW())
FROM users u
LEFT JOIN kyc_submissions ks
  ON ks.user_id = u.id
  AND ks.didit_session_id = u.didit_session_id
WHERE u.didit_session_id IS NOT NULL
  AND u.didit_session_id <> ''
ON CONFLICT (session_id) DO NOTHING;
