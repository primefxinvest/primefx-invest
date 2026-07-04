-- Realtime for transactions and wallet balances

ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE wallet_balances REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Admins read transactions" ON transactions;
CREATE POLICY "Admins read transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (public.is_active_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallet_balances'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallet_balances;
  END IF;
END $$;
