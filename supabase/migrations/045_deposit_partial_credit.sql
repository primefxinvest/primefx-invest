-- Partial NOWPayments deposit credit — atomic claim with settlement status

CREATE OR REPLACE FUNCTION claim_deposit_credit(
  p_order_id VARCHAR,
  p_payment_status VARCHAR,
  p_credited_usd DECIMAL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments;
BEGIN
  IF p_credited_usd <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  IF p_payment_status NOT IN ('completed', 'completed_partial') THEN
    RAISE EXCEPTION 'Invalid deposit payment status';
  END IF;

  UPDATE payments
  SET
    status = p_payment_status,
    updated_at = NOW(),
    completed_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb)
  WHERE order_id = p_order_id
    AND type = 'deposit'
    AND status IN ('pending', 'confirming', 'processing', 'created')
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_deposit_credit(VARCHAR, VARCHAR, DECIMAL, JSONB) TO service_role;
