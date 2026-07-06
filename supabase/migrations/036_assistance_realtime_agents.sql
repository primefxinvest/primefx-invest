-- PrimeFx Assistance v2: agents, realtime, agent messages, storage hardening

-- Re-apply core tables idempotently (safe if 035 was never run)
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1;

CREATE TABLE IF NOT EXISTS assistance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'escalated', 'resolved', 'closed')),
  category VARCHAR(50),
  escalation_reason TEXT,
  ticket_id UUID,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistance_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES assistance_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend role constraint to include agent
ALTER TABLE assistance_messages DROP CONSTRAINT IF EXISTS assistance_messages_role_check;
ALTER TABLE assistance_messages
  ADD CONSTRAINT assistance_messages_role_check
  CHECK (role IN ('user', 'assistant', 'system', 'agent'));

ALTER TABLE assistance_sessions
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS issue_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS assistance_session_id UUID;

CREATE INDEX IF NOT EXISTS idx_assistance_sessions_user
  ON assistance_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistance_sessions_status
  ON assistance_sessions (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistance_messages_session
  ON assistance_messages (session_id, created_at ASC);

-- Support agents registry
CREATE TABLE IF NOT EXISTS support_agents (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'PFX-' || LPAD(nextval('support_ticket_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_ticket_number ON support_tickets;
CREATE TRIGGER trg_support_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_support_ticket_number();

-- RLS
ALTER TABLE assistance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own assistance sessions" ON assistance_sessions;
CREATE POLICY "Users read own assistance sessions" ON assistance_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own assistance sessions" ON assistance_sessions;
CREATE POLICY "Users create own assistance sessions" ON assistance_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own assistance sessions" ON assistance_sessions;
CREATE POLICY "Users update own assistance sessions" ON assistance_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own assistance messages" ON assistance_messages;
CREATE POLICY "Users read own assistance messages" ON assistance_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assistance_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users insert own assistance messages" ON assistance_messages;
CREATE POLICY "Users insert own assistance messages" ON assistance_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assistance_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Support agents read all sessions" ON assistance_sessions;
DROP POLICY IF EXISTS "Support agents read all messages" ON assistance_messages;

-- Storage bucket (20MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assistance-attachments',
  'assistance-attachments',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

DROP POLICY IF EXISTS "Users upload own assistance attachments" ON storage.objects;
CREATE POLICY "Users upload own assistance attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assistance-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read own assistance attachments" ON storage.objects;
CREATE POLICY "Users read own assistance attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assistance-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'assistance_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assistance_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'assistance_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assistance_sessions;
  END IF;
END $$;
