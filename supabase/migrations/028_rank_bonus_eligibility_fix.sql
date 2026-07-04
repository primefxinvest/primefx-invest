-- Fix referral ranks and pending bonuses granted before member thresholds were met.

UPDATE user_referral_stats AS stats
SET
  rank_key = NULL,
  updated_at = NOW()
WHERE stats.rank_key IS NOT NULL
  AND stats.active_member_count < (
    SELECT min_members
    FROM referral_rank_tiers AS tiers
    WHERE tiers.key = stats.rank_key
  );

UPDATE referral_rank_rewards AS rewards
SET
  status = 'cancelled',
  admin_notes = COALESCE(
    rewards.admin_notes,
    'Cancelled: active member count below rank requirement'
  )
WHERE rewards.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM user_referral_stats AS stats
    WHERE stats.user_id = rewards.user_id
      AND stats.active_member_count < (
        SELECT min_members
        FROM referral_rank_tiers AS tiers
        WHERE tiers.key = rewards.rank_key
      )
  );
