-- Platform-wide feature toggles (admin-controlled)
CREATE TABLE IF NOT EXISTS platform_features (
  key VARCHAR(64) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO platform_features (key, enabled)
VALUES ('referral_program', FALSE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read platform features"
  ON platform_features FOR SELECT
  TO authenticated
  USING (true);
