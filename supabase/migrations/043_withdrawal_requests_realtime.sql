-- Enable realtime updates for wallet withdrawal requests (user + admin UI refresh).

ALTER TABLE withdrawal_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
  END IF;
END $$;
