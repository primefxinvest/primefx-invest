import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

type MirrorUserReplyInput = {
  sessionId: string
  content: string
  userId: string
  ticketId?: string
}

export async function resolveTicketIdForSession(
  db: SupabaseClient,
  sessionId: string
): Promise<string | null> {
  const { data: session } = await db
    .from('assistance_sessions')
    .select('ticket_id')
    .eq('id', sessionId)
    .maybeSingle()

  return session?.ticket_id ? String(session.ticket_id) : null
}

export async function mirrorUserReplyToTicket(
  db: SupabaseClient,
  input: MirrorUserReplyInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = input.content.trim()
  if (!body) return { ok: false, error: 'Message is required' }

  const ticketId = input.ticketId ?? (await resolveTicketIdForSession(db, input.sessionId))
  if (!ticketId) return { ok: true }

  const { error } = await db.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_type: 'user',
    sender_id: input.userId,
    message: body,
  })

  if (error) return { ok: false, error: error.message }

  await db
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  return { ok: true }
}
