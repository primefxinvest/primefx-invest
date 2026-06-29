-- Stable referral codes and one referral record per referred user
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code
  ON users (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_user_id
  ON referrals (referred_user_id);

-- Backfill referral codes for existing users
UPDATE users
SET referral_code = UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE referral_code IS NULL OR referral_code = '';
