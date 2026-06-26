-- PrimeFx Admin System: roles, audit trail, extended user/plan fields

-- Admin profiles (L1–L5 tiers)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 5),
  role_label VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Immutable admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  admin_tier SMALLINT,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(120) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_resource VARCHAR(120),
  before_state JSONB,
  after_state JSONB,
  reason_code VARCHAR(80),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extend users for admin operations
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_level VARCHAR(50) DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Extend investment plans for admin management
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS max_investment DECIMAL(15, 2);
ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS max_investors INTEGER;

CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read their own profile
CREATE POLICY "Admins read own profile" ON admin_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- No direct client writes to audit logs (server uses service role)
CREATE POLICY "Admins read audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.user_id = auth.uid()
        AND admin_profiles.is_active = TRUE
    )
  );
