-- Referral program engine: ranks, multi-level network, commissions, withdrawal queue, fees

CREATE TABLE IF NOT EXISTS referral_rank_tiers (
  key VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  min_members INTEGER NOT NULL,
  cash_bonus_usd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL
);

INSERT INTO referral_rank_tiers (key, name, min_members, cash_bonus_usd, perks, sort_order) VALUES
  ('bronze', 'PrimeFx Bronze', 50, 150, '[]'::jsonb, 1),
  ('silver', 'PrimeFx Silver', 100, 300, '[]'::jsonb, 2),
  ('gold', 'PrimeFx Gold', 300, 800, '[]'::jsonb, 3),
  ('platinum', 'PrimeFx Platinum', 500, 1500, '[]'::jsonb, 4),
  ('diamond', 'PrimeFx Diamond', 1000, 2000, '["3-day vacation trip (Asia or Europe)"]'::jsonb, 5),
  ('ambassador', 'PrimeFx Ambassador', 2500, 0, '["Company car","AcademyFx office","$1,000 monthly salary","0.5% of all team profits weekly"]'::jsonb, 6)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_referral_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rank_key VARCHAR(32) REFERENCES referral_rank_tiers(key),
  active_member_count INTEGER NOT NULL DEFAULT 0,
  total_member_count INTEGER NOT NULL DEFAULT 0,
  lifetime_commission_usd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  rank_achieved_at TIMESTAMPTZ,
  ambassador_benefits JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_network (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ancestor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  depth SMALLINT NOT NULL CHECK (depth BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ancestor_id, descendant_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_network_ancestor ON referral_network (ancestor_id, depth);
CREATE INDEX IF NOT EXISTS idx_referral_network_descendant ON referral_network (descendant_id);

CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 4),
  gross_profit_usd DECIMAL(15, 2) NOT NULL,
  commission_rate DECIMAL(8, 6) NOT NULL,
  commission_usd DECIMAL(15, 2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions (referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_period ON referral_commissions (period_start, period_end);

CREATE TABLE IF NOT EXISTS referral_rank_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank_key VARCHAR(32) NOT NULL REFERENCES referral_rank_tiers(key),
  cash_bonus_usd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, rank_key)
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(15, 2) NOT NULL,
  fee_usd DECIMAL(15, 2) NOT NULL,
  net_amount_usd DECIMAL(15, 2) NOT NULL,
  method_label VARCHAR(128),
  provider VARCHAR(32),
  currency VARCHAR(32),
  payout_address TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_notice',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  reference_id VARCHAR(100) UNIQUE,
  payment_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON withdrawal_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_available ON withdrawal_requests (status, available_at);

CREATE TABLE IF NOT EXISTS investment_profit_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  trading_days SMALLINT NOT NULL,
  total_profit_usd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period_start, period_end)
);

CREATE TABLE IF NOT EXISTS platform_fee_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fee_type VARCHAR(32) NOT NULL,
  gross_amount DECIMAL(15, 2) NOT NULL,
  fee_amount DECIMAL(15, 2) NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_features (key, enabled)
VALUES ('referral_profit_sharing', TRUE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE referral_rank_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rank_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_profit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read referral rank tiers"
  ON referral_rank_tiers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users read own referral stats"
  ON user_referral_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own referral network as ancestor"
  ON referral_network FOR SELECT TO authenticated
  USING (auth.uid() = ancestor_id);

CREATE POLICY "Users read own commissions"
  ON referral_commissions FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users read own rank rewards"
  ON referral_rank_rewards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own withdrawal requests"
  ON withdrawal_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own referrals"
  ON referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id);
