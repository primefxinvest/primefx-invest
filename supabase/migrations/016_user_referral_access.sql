-- Per-user referral page access (granted by admin in User Management)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_access_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_referral_access ON users (referral_access_enabled)
  WHERE referral_access_enabled = TRUE;
