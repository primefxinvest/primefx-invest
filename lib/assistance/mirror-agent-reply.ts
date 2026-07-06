import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

type MirrorAgentReplyInput = {
  sessionId: string
  content: string
  agentId: string
  agentEmail: string
  ticketId?: string
}

export async function insertAgentAssistanceMessage(
  db: SupabaseClient,
  input: MirrorAgentReplyInput
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const body = input.content.trim()
  if (!body) return { ok: false, error: 'Message is required' }

  const { data: inserted, error: insertError } = await db
    .from('assistance_messages')
    .insert({
      session_id: input.sessionId,
      role: 'agent',
      content: body,
      metadata: {
        agentId: input.agentId,
        agentName: input.agentEmail,
        readAt: null,
        ticketId: input.ticketId ?? null,
      },
    })
    .select('id, session_id, role, created_at')
    .single()

  if (insertError || !inserted) {
    console.error('[ADMIN_MESSAGE_CREATED] failed', {
      sessionId: input.sessionId,
      ticketId: input.ticketId,
      error: insertError?.message,
    })
    return { ok: false, error: insertError?.message ?? 'Failed to insert agent message' }
  }

  console.log('[ADMIN_MESSAGE_CREATED]', {
    messageId: inserted.id,
    sessionId: inserted.session_id,
    role: inserted.role,
    ticketId: input.ticketId ?? null,
    createdAt: inserted.created_at,
  })

  await db
    .from('assistance_sessions')
    .update({
      assigned_agent_id: input.agentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.sessionId)

  return { ok: true, messageId: String(inserted.id) }
}

export async function resolveAssistanceSessionIdForTicket(
  db: SupabaseClient,
  ticket: { id: string; assistance_session_id?: string | null }
): Promise<string | null> {
  if (ticket.assistance_session_id) {
    return String(ticket.assistance_session_id)
  }

  const { data: session } = await db
    .from('assistance_sessions')
    .select('id')
    .eq('ticket_id', ticket.id)
    .maybeSingle()

  return session?.id ? String(session.id) : null
}
