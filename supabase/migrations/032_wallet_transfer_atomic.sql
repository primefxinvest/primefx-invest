-- Wallet transfer atomic fix
-- Ensures atomic wallet RPCs exist and adds single-transaction P2P transfer.

-- Re-create atomic wallet helpers (idempotent — fixes missing migration 029 on production)
CREATE OR REPLACE FUNCTION atomic_credit_wallet(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance + p_amount,
    total_balance = total_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  RETURN v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION atomic_debit_wallet(p_user_id UUID, p_amount DECIMAL)
RETURNS wallet_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet wallet_balances;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be positive';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance - p_amount,
    total_balance = GREATEST(0, total_balance - p_amount),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND available_balance >= p_amount
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  RETURN v_wallet;
END;
$$;

-- Single atomic P2P transfer with row locks (sender + recipient)
CREATE OR REPLACE FUNCTION execute_atomic_wallet_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_recipient_amount DECIMAL,
  p_fee_amount DECIMAL,
  p_reference_id VARCHAR,
  p_sender_description TEXT,
  p_recipient_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_total DECIMAL;
  v_sender_wallet wallet_balances;
  v_recipient_wallet wallet_balances;
BEGIN
  IF p_sender_id = p_recipient_id THEN
    RAISE EXCEPTION 'SELF_TRANSFER';
  END IF;

  IF p_recipient_amount <= 0 OR p_fee_amount < 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  v_sender_total := p_recipient_amount + p_fee_amount;

  IF v_sender_total <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Lock both wallets in deterministic order to prevent deadlocks
  PERFORM 1
  FROM wallet_balances
  WHERE user_id IN (p_sender_id, p_recipient_id)
  ORDER BY user_id
  FOR UPDATE;

  IF NOT EXISTS (SELECT 1 FROM wallet_balances WHERE user_id = p_sender_id) THEN
    RAISE EXCEPTION 'SENDER_WALLET_NOT_FOUND';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM wallet_balances WHERE user_id = p_recipient_id) THEN
    RAISE EXCEPTION 'RECIPIENT_WALLET_NOT_FOUND';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance - v_sender_total,
    total_balance = GREATEST(0, total_balance - v_sender_total),
    updated_at = NOW()
  WHERE user_id = p_sender_id
    AND available_balance >= v_sender_total
  RETURNING * INTO v_sender_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  UPDATE wallet_balances
  SET
    available_balance = available_balance + p_recipient_amount,
    total_balance = total_balance + p_recipient_amount,
    updated_at = NOW()
  WHERE user_id = p_recipient_id
  RETURNING * INTO v_recipient_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RECIPIENT_WALLET_NOT_FOUND';
  END IF;

  INSERT INTO transactions (user_id, type, amount, status, description, reference_id)
  VALUES
    (
      p_sender_id,
      'transfer_sent',
      v_sender_total,
      'Completed',
      p_sender_description,
      p_reference_id || '-transfer_sent'
    ),
    (
      p_recipient_id,
      'transfer_received',
      p_recipient_amount,
      'Completed',
      p_recipient_description,
      p_reference_id || '-transfer_received'
    );

  INSERT INTO platform_fee_ledger (user_id, fee_type, gross_amount, fee_amount, reference_id)
  VALUES (p_sender_id, 'p2p_transfer', p_recipient_amount, p_fee_amount, p_reference_id);

  RETURN jsonb_build_object(
    'reference_id', p_reference_id,
    'sender_balance', v_sender_wallet.available_balance,
    'recipient_balance', v_recipient_wallet.available_balance,
    'sender_total', v_sender_total,
    'recipient_amount', p_recipient_amount,
    'fee_amount', p_fee_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION atomic_credit_wallet(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION atomic_debit_wallet(UUID, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION execute_atomic_wallet_transfer(UUID, UUID, DECIMAL, DECIMAL, VARCHAR, TEXT, TEXT) TO service_role;

-- Notify PostgREST to reload schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
