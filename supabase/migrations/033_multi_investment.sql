-- Multi-investment architecture: independent investment records with traceable references.

ALTER TABLE investments
  ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_investments_reference_id
  ON investments (reference_id)
  WHERE reference_id IS NOT NULL;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS investment_id UUID REFERENCES investments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_investment_id
  ON transactions (investment_id)
  WHERE investment_id IS NOT NULL;

COMMENT ON COLUMN investments.reference_id IS 'Unique human-readable investment reference (e.g. INV-20260705-ABC).';
COMMENT ON COLUMN transactions.investment_id IS 'Links profit and investment transactions to a specific investment position.';

-- Backfill traceable references for investments created before multi-investment rollout.
UPDATE investments
SET reference_id = 'INV-' || TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
WHERE reference_id IS NULL;
