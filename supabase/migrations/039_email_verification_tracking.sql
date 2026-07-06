-- Track last verification email send time for resend rate limiting UI.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_email_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_verification_email_sent_at
  ON users(verification_email_sent_at)
  WHERE verification_email_sent_at IS NOT NULL;
