-- Admin Investment Management: display ranks (cosmetic only — no business logic impact)

CREATE TABLE IF NOT EXISTS admin_display_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  badge VARCHAR(50),
  color VARCHAR(20) NOT NULL DEFAULT '#0052ff',
  icon VARCHAR(50) NOT NULL DEFAULT 'Award',
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_display_ranks_status
  ON admin_display_ranks (status, priority DESC);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_display_rank_id UUID REFERENCES admin_display_ranks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_admin_display_rank
  ON users (admin_display_rank_id);

INSERT INTO admin_display_ranks (name, badge, color, icon, description, priority, benefits, status, is_custom)
VALUES
  ('Standard Investor', 'STD', '#64748b', 'User', 'Default investor classification.', 10, '["Platform access"]'::jsonb, 'active', false),
  ('Starter Investor', 'STR', '#0052ff', 'Sprout', 'Entry-level investor rank.', 20, '["Starter benefits"]'::jsonb, 'active', false),
  ('Silver Investor', 'SLV', '#94a3b8', 'Medal', 'Silver tier recognition.', 30, '["Priority insights"]'::jsonb, 'active', false),
  ('Gold Investor', 'GLD', '#f59e0b', 'Crown', 'Gold tier recognition.', 40, '["Enhanced visibility"]'::jsonb, 'active', false),
  ('Diamond Investor', 'DMD', '#06b6d4', 'Gem', 'Diamond tier recognition.', 50, '["VIP support queue"]'::jsonb, 'active', false),
  ('VIP Investor', 'VIP', '#8b5cf6', 'Star', 'VIP investor status.', 60, '["VIP concierge"]'::jsonb, 'active', false),
  ('Elite Investor', 'ELT', '#0f172a', 'Shield', 'Elite investor status.', 70, '["Elite privileges"]'::jsonb, 'active', false),
  ('Ambassador', 'AMB', '#10b981', 'Megaphone', 'Community ambassador.', 80, '["Ambassador perks"]'::jsonb, 'active', false),
  ('Partner', 'PTR', '#2563eb', 'Handshake', 'Official partner.', 90, '["Partner benefits"]'::jsonb, 'active', false),
  ('Regional Partner', 'RGN', '#7c3aed', 'Globe', 'Regional partner recognition.', 100, '["Regional perks"]'::jsonb, 'active', false),
  ('Global Partner', 'GLB', '#dc2626', 'Earth', 'Global partner recognition.', 110, '["Global perks"]'::jsonb, 'active', false),
  ('Custom Rank', 'CST', '#475569', 'Sparkles', 'Admin-defined custom rank.', 5, '[]'::jsonb, 'active', true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE admin_display_ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages display ranks" ON admin_display_ranks;
CREATE POLICY "Service role manages display ranks" ON admin_display_ranks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE admin_display_ranks IS 'Cosmetic admin-assigned display ranks. Does not affect wallet, investments, profits, or referrals.';
COMMENT ON COLUMN users.admin_display_rank_id IS 'Optional cosmetic rank assigned by admin. Isolated from investor_tier and referral ranks.';
