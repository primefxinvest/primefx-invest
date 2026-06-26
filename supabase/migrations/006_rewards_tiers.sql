-- Rewards tiers table (safe to run if 001_create_schema.sql was not applied fully)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.rewards_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name VARCHAR(50) NOT NULL UNIQUE,
  minimum_points INTEGER NOT NULL,
  bonus_percentage DECIMAL(5, 2),
  benefits TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.rewards_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rewards tiers are readable" ON public.rewards_tiers;
CREATE POLICY "Rewards tiers are readable" ON public.rewards_tiers
  FOR SELECT USING (TRUE);

INSERT INTO public.rewards_tiers (tier_name, minimum_points, bonus_percentage, benefits)
VALUES
  ('Bronze Level', 0, 0, 'Basic support, community access'),
  ('Silver Level', 501, 2.5, 'Priority support, referral bonus boost'),
  ('Gold Level', 1501, 5, 'Dedicated account manager, lower fees'),
  ('Platinum Level', 3001, 7.5, 'VIP events, maximum referral rewards'),
  ('Diamond Level', 5001, 10, 'Elite concierge, exclusive plan access')
ON CONFLICT (tier_name) DO NOTHING;
