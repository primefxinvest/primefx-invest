-- Support tickets, user preferences, market insights, reward catalog, academy seeds

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) NOT NULL DEFAULT 'auto',
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  investment_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en VARCHAR(255) NOT NULL,
  title_de VARCHAR(255),
  title_es VARCHAR(255),
  title_fr VARCHAR(255),
  summary_en TEXT NOT NULL,
  summary_de TEXT,
  summary_es TEXT,
  summary_fr TEXT,
  tag VARCHAR(50) NOT NULL DEFAULT 'Markets',
  sentiment VARCHAR(20) NOT NULL DEFAULT 'neutral',
  asset_symbol VARCHAR(20),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reward_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  points_cost INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_id UUID NOT NULL REFERENCES reward_catalog(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS lessons_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reward_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own support tickets" ON support_tickets;
CREATE POLICY "Users read own support tickets" ON support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own support tickets" ON support_tickets;
CREATE POLICY "Users create own support tickets" ON support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Market insights are public" ON market_insights;
CREATE POLICY "Market insights are public" ON market_insights
  FOR SELECT TO authenticated USING (active = TRUE);

DROP POLICY IF EXISTS "Reward catalog is public" ON reward_catalog;
CREATE POLICY "Reward catalog is public" ON reward_catalog
  FOR SELECT TO authenticated USING (active = TRUE);

DROP POLICY IF EXISTS "Users read own redemptions" ON user_reward_redemptions;
CREATE POLICY "Users read own redemptions" ON user_reward_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own redemptions" ON user_reward_redemptions;
CREATE POLICY "Users create own redemptions" ON user_reward_redemptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

INSERT INTO academy_courses (title, description, category, difficulty, duration_minutes, instructor_name, lessons_count)
SELECT * FROM (VALUES
  ('Investing Basics', 'Core concepts for new investors.', 'Fundamentals', 'Beginner', 240, 'PrimeFx Academy', 12),
  ('Risk Management', 'Protect capital and manage drawdowns.', 'Advanced', 'Intermediate', 120, 'PrimeFx Academy', 8),
  ('Wealth Building Strategies', 'Long-term portfolio growth frameworks.', 'Advanced', 'Advanced', 360, 'PrimeFx Academy', 15),
  ('Forex Basics', 'Introduction to currency markets.', 'Markets', 'Beginner', 180, 'PrimeFx Academy', 10),
  ('Technical Analysis', 'Chart patterns and indicators.', 'Markets', 'Intermediate', 300, 'PrimeFx Academy', 14)
) AS seed(title, description, category, difficulty, duration_minutes, instructor_name, lessons_count)
WHERE NOT EXISTS (SELECT 1 FROM academy_courses LIMIT 1);

INSERT INTO market_insights (title_en, title_de, title_es, title_fr, summary_en, summary_de, summary_es, summary_fr, tag, sentiment, asset_symbol)
SELECT * FROM (VALUES
  (
    'Bitcoin breaks resistance',
    'Bitcoin durchbricht Widerstand',
    'Bitcoin rompe la resistencia',
    'Bitcoin franchit la résistance',
    'BTC cleared key resistance with rising volume. Momentum remains constructive on the daily chart.',
    'BTC durchbrach wichtigen Widerstand bei steigendem Volumen.',
    'BTC superó una resistencia clave con volumen creciente.',
    'BTC a franchi une résistance clé avec un volume en hausse.',
    'Crypto', 'bullish', 'BTC'
  ),
  (
    'EUR/USD consolidates',
    'EUR/USD konsolidiert',
    'EUR/USD consolida',
    'EUR/USD consolide',
    'Euro trades in a tight range ahead of central bank commentary. Short-term volatility is expected.',
    'Der Euro handelt in einer engen Range vor Zentralbank-Kommentaren.',
    'El euro opera en un rango estrecho antes de comentarios del banco central.',
    'L''euro évolue dans une fourchette étroite avant les commentaires de la BCE.',
    'Forex', 'neutral', 'EUR/USD'
  ),
  (
    'Gold holds safe-haven bid',
    'Gold hält Safe-Haven-Nachfrage',
    'El oro mantiene demanda refugio',
    'L''or conserve sa demande valeur refuge',
    'Precious metals remain supported as investors seek diversification amid macro uncertainty.',
    'Edelmetalle bleiben unterstützt, da Anleger Diversifikation suchen.',
    'Los metales preciosos siguen apoyados mientras los inversores buscan diversificación.',
    'Les métaux précieux restent soutenus alors que les investisseurs diversifient.',
    'Commodities', 'bullish', 'XAU/USD'
  )
) AS seed(title_en, title_de, title_es, title_fr, summary_en, summary_de, summary_es, summary_fr, tag, sentiment, asset_symbol)
WHERE NOT EXISTS (SELECT 1 FROM market_insights LIMIT 1);

INSERT INTO reward_catalog (name, description, points_cost)
VALUES
  ('Trading Credit $10', 'Apply $10 credit toward your next investment.', 500),
  ('Premium Course Access', 'Unlock one premium academy module.', 750),
  ('Priority Support (30 days)', 'Faster support response for 30 days.', 1000),
  ('Fee Discount 5%', '5% fee discount on your next withdrawal.', 1500)
ON CONFLICT (name) DO NOTHING;
