-- Support ticket conversation messages (admin + user replies)

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON support_ticket_messages (ticket_id, created_at ASC);

ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ticket messages" ON support_ticket_messages;
CREATE POLICY "Users read own ticket messages" ON support_ticket_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users reply on own tickets" ON support_ticket_messages;
CREATE POLICY "Users reply on own tickets" ON support_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'user'
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );
