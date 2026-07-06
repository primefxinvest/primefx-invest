import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { AGENT_JOIN_MESSAGE } from '@/lib/assistance/constants'

type MirrorAgentReplyInput = {
  sessionId: string
  content: string
  agentId: string
  agentEmail: string
  ticketId?: string
}

type EnsureAgentJoinInput = {
  sessionId: string
  agentId: string
  agentEmail: string
}

export async function ensureAgentJoinMessage(
  db: SupabaseClient,
  input: EnsureAgentJoinInput
): Promise<{ ok: true; joined: boolean; messageId?: string } | { ok: false; error: string }> {
  const { data: existing } = await db
    .from('assistance_messages')
    .select('id')
    .eq('session_id', input.sessionId)
    .eq('role', 'system')
    .filter('metadata->>eventType', 'eq', 'agent_join')
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    return { ok: true, joined: false }
  }

  const joinedAt = new Date().toISOString()
  const { data: inserted, error } = await db
    .from('assistance_messages')
    .insert({
      session_id: input.sessionId,
      role: 'system',
      content: AGENT_JOIN_MESSAGE,
      metadata: {
        eventType: 'agent_join',
        agentId: input.agentId,
        agentName: input.agentEmail,
        joinedAt,
      },
    })
    .select('id')
    .single()

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'Failed to record agent join' }
  }

  await db
    .from('assistance_sessions')
    .update({
      assigned_agent_id: input.agentId,
      updated_at: joinedAt,
    })
    .eq('id', input.sessionId)

  await db
    .from('support_agents')
    .upsert({
      user_id: input.agentId,
      display_name: input.agentEmail,
      is_online: true,
      last_seen_at: joinedAt,
      updated_at: joinedAt,
    })

  return { ok: true, joined: true, messageId: String(inserted.id) }
}

export async function insertAgentAssistanceMessage(
  db: SupabaseClient,
  input: MirrorAgentReplyInput
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const body = input.content.trim()
  if (!body) return { ok: false, error: 'Message is required' }

  const joinResult = await ensureAgentJoinMessage(db, {
    sessionId: input.sessionId,
    agentId: input.agentId,
    agentEmail: input.agentEmail,
  })
  if (!joinResult.ok) {
    return { ok: false, error: joinResult.error }
  }

  const sentAt = new Date().toISOString()
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
        deliveredAt: sentAt,
        sentAt,
        deliveryStatus: 'sent',
        ticketId: input.ticketId ?? null,
      },
    })
    .select('id, session_id, role, created_at')
    .single()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? 'Failed to insert agent message' }
  }

  await db
    .from('assistance_sessions')
    .update({
      assigned_agent_id: input.agentId,
      updated_at: sentAt,
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

export async function markUserMessagesDelivered(
  db: SupabaseClient,
  sessionId: string,
  messageIds?: string[]
): Promise<void> {
  const deliveredAt = new Date().toISOString()

  let query = db
    .from('assistance_messages')
    .select('id, metadata')
    .eq('session_id', sessionId)
    .eq('role', 'user')

  if (messageIds?.length) {
    query = query.in('id', messageIds)
  }

  const { data: rows } = await query

  for (const row of rows ?? []) {
    const meta = (row.metadata as Record<string, unknown>) ?? {}
    if (meta.deliveredAt) continue
    await db
      .from('assistance_messages')
      .update({
        metadata: {
          ...meta,
          deliveredAt,
          deliveryStatus: 'delivered',
        },
      })
      .eq('id', row.id)
  }
}

export async function markMessagesReadByRole(
  db: SupabaseClient,
  sessionId: string,
  targetRole: 'user' | 'agent'
): Promise<void> {
  const readAt = new Date().toISOString()

  const { data: rows } = await db
    .from('assistance_messages')
    .select('id, metadata')
    .eq('session_id', sessionId)
    .eq('role', targetRole)

  for (const row of rows ?? []) {
    const meta = (row.metadata as Record<string, unknown>) ?? {}
    if (meta.readAt) continue
    await db
      .from('assistance_messages')
      .update({
        metadata: {
          ...meta,
          readAt,
          deliveryStatus: 'read',
        },
      })
      .eq('id', row.id)
  }
}
