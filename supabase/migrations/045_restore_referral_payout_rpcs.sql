-- Restore referral payout claim RPCs (missing on production; required for commission/bonus payouts)

CREATE OR REPLACE FUNCTION claim_referral_commission_payout(
  p_commission_id UUID,
  p_reference_id VARCHAR
)
RETURNS referral_commissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row referral_commissions;
BEGIN
  UPDATE referral_commissions
  SET
    status = 'paying',
    reference_id = p_reference_id
  WHERE id = p_commission_id
    AND status = 'pending'
    AND commission_usd > 0
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION claim_referral_rank_bonus_payout(p_reward_id UUID)
RETURNS referral_rank_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row referral_rank_rewards;
BEGIN
  UPDATE referral_rank_rewards
  SET status = 'paying'
  WHERE id = p_reward_id
    AND status = 'pending'
    AND cash_bonus_usd > 0
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_referral_commission_payout(UUID, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION claim_referral_rank_bonus_payout(UUID) TO service_role;
