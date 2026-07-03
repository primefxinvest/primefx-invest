-- Referral program completion: welcome bonus tracking, commission types, capital withdrawals, terms

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS welcome_bonus_paid BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE referral_commissions
  ADD COLUMN IF NOT EXISTS commission_type VARCHAR(32) NOT NULL DEFAULT 'profit_share';

ALTER TABLE referral_commissions
  DROP CONSTRAINT IF EXISTS referral_commissions_level_check;

ALTER TABLE referral_commissions
  ADD CONSTRAINT referral_commissions_level_check
  CHECK (level BETWEEN 0 AND 4);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_type
  ON referral_commissions (commission_type, status);

CREATE TABLE IF NOT EXISTS investment_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  amount_usd DECIMAL(15, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_notice',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  reference_id VARCHAR(100) UNIQUE,
  support_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_withdrawal_user
  ON investment_withdrawal_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_investment_withdrawal_due
  ON investment_withdrawal_requests (status, available_at);

CREATE TABLE IF NOT EXISTS platform_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_terms_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_version VARCHAR(32) NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, terms_version)
);

ALTER TABLE investment_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_terms_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own investment withdrawal requests"
  ON investment_withdrawal_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read published terms"
  ON platform_terms FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users read own terms acknowledgements"
  ON user_terms_acknowledgements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO platform_terms (version, title, content, requires_acknowledgement)
VALUES (
  '2026-01',
  'PrimeFx Invest — Investment Terms and Fees',
  'See application legal center for full terms.',
  TRUE
)
ON CONFLICT (version) DO NOTHING;
