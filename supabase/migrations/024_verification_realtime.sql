-- Realtime + RLS for Didit verification session status updates

CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_profiles
    WHERE user_id = auth.uid()
      AND is_active = TRUE
  );
$$;

ALTER TABLE verification_sessions REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Users read own verification sessions" ON verification_sessions;
CREATE POLICY "Users read own verification sessions"
  ON verification_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR vendor_data = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins read verification sessions" ON verification_sessions;
CREATE POLICY "Admins read verification sessions"
  ON verification_sessions
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
      AND tablename = 'verification_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE verification_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END $$;
