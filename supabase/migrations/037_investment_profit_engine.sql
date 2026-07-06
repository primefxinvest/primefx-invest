-- Investment profit engine v2: daily crediting, history, snapshots, capital lock

ALTER TABLE investment_plans
  ADD COLUMN IF NOT EXISTS capital_lock_days SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compound_mode BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE investment_plans
SET capital_lock_days = 7
WHERE name = 'Starter Plan' AND capital_lock_days = 0;

ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS daily_profit DECIMAL(15, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accumulated_profit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_payout_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_profit_calculation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS compound_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS capital_withdrawal_unlock_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS investment_profit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  amount_usd DECIMAL(15, 2) NOT NULL,
  daily_rate DECIMAL(14, 8) NOT NULL,
  principal_usd DECIMAL(15, 2) NOT NULL,
  transaction_id UUID,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investment_id, period_date)
);

CREATE INDEX IF NOT EXISTS idx_investment_profit_history_user_date
  ON investment_profit_history (user_id, period_date DESC);

CREATE TABLE IF NOT EXISTS investment_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd DECIMAL(15, 2) NOT NULL,
  payout_type VARCHAR(30) NOT NULL DEFAULT 'daily',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  transaction_id UUID,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_payouts_investment
  ON investment_payouts (investment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS investment_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  principal_usd DECIMAL(15, 2) NOT NULL,
  accumulated_profit_usd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  current_value_usd DECIMAL(15, 2) NOT NULL,
  daily_rate DECIMAL(14, 8) NOT NULL,
  daily_profit_usd DECIMAL(15, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investment_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_investment_daily_snapshots_user
  ON investment_daily_snapshots (user_id, snapshot_date DESC);

-- Backfill unlock dates for existing Starter investments
UPDATE investments i
SET capital_withdrawal_unlock_at = i.created_at + INTERVAL '7 days'
FROM investment_plans p
WHERE i.plan_id = p.id
  AND p.name = 'Starter Plan'
  AND i.capital_withdrawal_unlock_at IS NULL;

-- Backfill accumulated_profit from current_value - amount
UPDATE investments
SET accumulated_profit = GREATEST(0, ROUND((current_value - amount)::numeric, 2))
WHERE accumulated_profit = 0
  AND current_value > amount;

-- Idempotent per-investment daily profit claim
CREATE OR REPLACE FUNCTION claim_investment_daily_profit(
  p_investment_id UUID,
  p_user_id UUID,
  p_period_date DATE,
  p_amount_usd DECIMAL,
  p_daily_rate DECIMAL,
  p_principal_usd DECIMAL,
  p_reference_id VARCHAR
)
RETURNS investment_profit_history
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row investment_profit_history;
BEGIN
  INSERT INTO investment_profit_history (
    investment_id,
    user_id,
    period_date,
    amount_usd,
    daily_rate,
    principal_usd,
    reference_id
  )
  VALUES (
    p_investment_id,
    p_user_id,
    p_period_date,
    p_amount_usd,
    p_daily_rate,
    p_principal_usd,
    p_reference_id
  )
  ON CONFLICT (investment_id, period_date) DO NOTHING
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_investment_daily_profit(UUID, UUID, DATE, DECIMAL, DECIMAL, DECIMAL, VARCHAR) TO service_role;

ALTER TABLE investment_profit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_daily_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profit history" ON investment_profit_history;
CREATE POLICY "Users read own profit history" ON investment_profit_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own payouts" ON investment_payouts;
CREATE POLICY "Users read own payouts" ON investment_payouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own snapshots" ON investment_daily_snapshots;
CREATE POLICY "Users read own snapshots" ON investment_daily_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'investment_profit_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investment_profit_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'investments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investments;
  END IF;
END $$;
