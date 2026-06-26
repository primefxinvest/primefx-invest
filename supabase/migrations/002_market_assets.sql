-- Market assets for dashboard / invest pages
CREATE TABLE IF NOT EXISTS market_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  price VARCHAR(50) NOT NULL,
  change VARCHAR(20) NOT NULL,
  trend VARCHAR(10) NOT NULL DEFAULT 'up',
  icon VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE market_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market assets are public" ON market_assets
  FOR SELECT USING (TRUE);

INSERT INTO market_assets (symbol, price, change, trend, icon)
SELECT * FROM (VALUES
  ('BTC/USDT', '$67,890.45', '+2.53%', 'up', 'B'),
  ('ETH/USDT', '$3,560.22', '+1.85%', 'up', 'E'),
  ('GOLD', '$2,345.60', '+0.81%', 'up', 'G'),
  ('EUR/USD', '1.0887', '-0.15%', 'down', '$')
) AS seed(symbol, price, change, trend, icon)
WHERE NOT EXISTS (SELECT 1 FROM market_assets LIMIT 1);
