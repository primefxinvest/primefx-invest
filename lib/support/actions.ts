'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { resolveAssistanceSessionIdForTicket } from '@/lib/assistance/mirror-agent-reply'

export async function submitSupportTicket(input: {
  subject: string
  description: string
  priority?: string
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.id) {
    return { ok: false as const, error: 'Not authenticated' }
  }

  const subject = input.subject.trim()
  const description = input.description.trim()
  if (!subject || !description) {
    return { ok: false as const, error: 'Subject and description are required' }
  }

  const { error } = await supabase.from('support_tickets').insert([
    {
      user_id: user.id,
      subject,
      description,
      priority: input.priority ?? 'medium',
    },
  ])

  if (error) {
    return { ok: false as const, error: error.message }
  }

  revalidatePath('/support')
  return { ok: true as const }
}

export async function replyToSupportTicket(ticketId: string, message: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.id) {
    return { ok: false as const, error: 'Not authenticated' }
  }

  const body = message.trim()
  if (!body) {
    return { ok: false as const, error: 'Message is required' }
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, status, assistance_session_id')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (ticketError || !ticket) {
    return { ok: false as const, error: 'Ticket not found' }
  }

  const closedStatuses = new Set(['resolved', 'closed'])
  if (closedStatuses.has(String(ticket.status).toLowerCase())) {
    return { ok: false as const, error: 'This ticket is closed' }
  }

  const { error: messageError } = await supabase.from('support_ticket_messages').insert([
    {
      ticket_id: ticketId,
      sender_type: 'user',
      sender_id: user.id,
      message: body,
    },
  ])

  if (messageError) {
    return { ok: false as const, error: messageError.message }
  }

  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  const adminDb = createAdminSupabaseClient()
  if (adminDb) {
    const sessionId = await resolveAssistanceSessionIdForTicket(adminDb, {
      id: ticketId,
      assistance_session_id: (ticket.assistance_session_id as string) ?? null,
    })
    if (sessionId) {
      await adminDb.from('assistance_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: body,
        metadata: {
          sentAt: new Date().toISOString(),
          deliveryStatus: 'sent',
          mirroredFromTicket: ticketId,
        },
      })
      await adminDb
        .from('assistance_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    }
  }

  revalidatePath('/support')
  return { ok: true as const }
}
