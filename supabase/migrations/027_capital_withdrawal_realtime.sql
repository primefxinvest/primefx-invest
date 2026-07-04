-- Realtime for investment capital withdrawal request status updates

ALTER TABLE investment_withdrawal_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'investment_withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investment_withdrawal_requests;
  END IF;
END $$;
