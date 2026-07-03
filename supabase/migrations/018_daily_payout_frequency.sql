-- Switch investment plans to daily profit distribution
UPDATE investment_plans
SET payout_frequency = 'Daily'
WHERE payout_frequency IS NULL OR payout_frequency = 'Every 7 Days';

ALTER TABLE investment_plans
  ALTER COLUMN payout_frequency SET DEFAULT 'Daily';
