'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolveEffectiveKycStatus } from '@/lib/investor/kyc'
import {
  buildEscalationSummary,
  formatEscalationSummaryForTicket,
} from '@/lib/assistance/escalation'
import { isTableMissingError } from '@/lib/assistance/infrastructure'
import { ensureAssistanceStorageBucket } from '@/lib/assistance/storage'
import type {
  AssistanceAttachment,
  AssistanceMessage,
  AssistanceSession,
  AssistanceSessionPayload,
  EscalationSummary,
} from '@/lib/assistance/types'
import {
  ALLOWED_ATTACHMENT_TYPES,
  ASSISTANCE_ATTACHMENT_BUCKET,
  MAX_ATTACHMENT_SIZE,
} from '@/lib/assistance/constants'
import { notifySupportEscalation } from '@/lib/notifications/service'

const CONNECTED_MESSAGE =
  'You are now connected to a PrimeFx Support Specialist. A team member will join shortly.'

function mapSession(row: Record<string, unknown>, ticketNumber?: string | null): AssistanceSession {
  return {
    id: String(row.id),
    status: String(row.status) as AssistanceSession['status'],
    category: (row.category as AssistanceSession['category']) ?? null,
    escalationReason: (row.escalation_reason as string) ?? null,
    ticketId: (row.ticket_id as string) ?? null,
    ticketNumber: ticketNumber ?? null,
    assignedAgentId: (row.assigned_agent_id as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapMessage(row: Record<string, unknown>): AssistanceMessage {
  return {
    id: String(row.id),
    role: String(row.role) as AssistanceMessage['role'],
    content: String(row.content),
    metadata: (row.metadata as AssistanceMessage['metadata']) ?? {},
    createdAt: String(row.created_at),
  }
}

async function requireAuthUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.id) {
    return { supabase, user: null as null }
  }

  return { supabase, user }
}

async function loadSessionPayload(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  sessionRow: Record<string, unknown>
): Promise<AssistanceSessionPayload> {
  const { data: messageRows } = await supabase
    .from('assistance_messages')
    .select('*')
    .eq('session_id', sessionRow.id)
    .order('created_at', { ascending: true })

  let ticketNumber: string | null = null
  if (sessionRow.ticket_id) {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('ticket_number')
      .eq('id', sessionRow.ticket_id)
      .maybeSingle()
    ticketNumber = (ticket?.ticket_number as string) ?? null
  }

  const messages = (messageRows ?? []).map(mapMessage)
  const hasAgentReply = messages.some((m) => m.role === 'agent')

  return {
    session: mapSession(sessionRow, ticketNumber),
    messages,
    hasAgentReply,
  }
}

export async function getOrCreateAssistanceSession(): Promise<{
  ok: boolean
  data?: AssistanceSessionPayload
  error?: string
  infrastructureMissing?: boolean
}> {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: existing, error: existingError } = await supabase
    .from('assistance_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'escalated'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    if (isTableMissingError(existingError.message)) {
      return {
        ok: false,
        infrastructureMissing: true,
        error: 'Support chat is being set up. Please try again shortly or email support.',
      }
    }
    return { ok: false, error: existingError.message }
  }

  let sessionRow = existing

  if (!sessionRow) {
    const { data: created, error: createError } = await supabase
      .from('assistance_sessions')
      .insert([{ user_id: user.id }])
      .select('*')
      .single()

    if (createError) {
      if (isTableMissingError(createError.message)) {
        return {
          ok: false,
          infrastructureMissing: true,
          error: 'Support chat is being set up. Please try again shortly or email support.',
        }
      }
      return { ok: false, error: createError.message ?? 'Failed to create session' }
    }
    sessionRow = created
  }

  return { ok: true, data: await loadSessionPayload(supabase, sessionRow) }
}

export async function saveAssistanceMessage(input: {
  sessionId: string
  role: 'user' | 'assistant' | 'system' | 'agent'
  content: string
  metadata?: AssistanceMessage['metadata']
}) {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false as const, error: 'Not authenticated' }

  const content = input.content.trim()
  if (!content) return { ok: false as const, error: 'Message is required' }

  const { data: session } = await supabase
    .from('assistance_sessions')
    .select('id')
    .eq('id', input.sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!session) return { ok: false as const, error: 'Session not found' }

  const { data, error } = await supabase
    .from('assistance_messages')
    .insert([
      {
        session_id: input.sessionId,
        role: input.role,
        content,
        metadata: input.metadata ?? {},
      },
    ])
    .select('*')
    .single()

  if (error) return { ok: false as const, error: error.message }

  await supabase
    .from('assistance_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.sessionId)

  return { ok: true as const, message: mapMessage(data) }
}

export async function escalateAssistanceSession(input: {
  sessionId?: string
  escalationReason: string
  messages: { role: string; content: string }[]
  aiActions?: string[]
}): Promise<{
  ok: boolean
  sessionId?: string
  ticketNumber?: string
  ticketId?: string
  summary?: EscalationSummary
  connectedMessage?: string
  error?: string
  infrastructureMissing?: boolean
}> {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  let sessionId = input.sessionId

  if (!sessionId) {
    const created = await getOrCreateAssistanceSession()
    if (!created.ok || !created.data) {
      return {
        ok: false,
        error: created.error,
        infrastructureMissing: created.infrastructureMissing,
      }
    }
    sessionId = created.data.session.id
  }

  const { data: session, error: sessionError } = await supabase
    .from('assistance_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (sessionError) {
    if (isTableMissingError(sessionError.message)) {
      return { ok: false, infrastructureMissing: true, error: sessionError.message }
    }
    return { ok: false, error: sessionError.message }
  }

  if (!session) return { ok: false, error: 'Session not found' }

  if (session.ticket_id) {
    const { data: existingTicket } = await supabase
      .from('support_tickets')
      .select('id, ticket_number')
      .eq('id', session.ticket_id)
      .maybeSingle()
    return {
      ok: true,
      sessionId,
      ticketId: String(session.ticket_id),
      ticketNumber: String(existingTicket?.ticket_number ?? ''),
      connectedMessage: CONNECTED_MESSAGE,
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('kyc_status, is_verified, verification_status')
    .eq('id', user.id)
    .maybeSingle()

  const kycStatus = resolveEffectiveKycStatus(profile) ?? 'Pending'
  const summary = buildEscalationSummary({
    messages: input.messages,
    kycStatus,
    escalationReason: input.escalationReason,
    aiActions: input.aiActions,
  })

  const aiSummary = formatEscalationSummaryForTicket(summary)
  const subject = `Escalated: ${summary.issue.slice(0, 80)}`

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert([
      {
        user_id: user.id,
        subject,
        description: summary.conversationSummary,
        priority: summary.category === 'withdrawals' || summary.category === 'security' ? 'high' : 'medium',
        status: 'open',
        category: summary.category,
        issue_summary: summary.issue,
        ai_summary: aiSummary,
        assistance_session_id: sessionId,
      },
    ])
    .select('id, ticket_number')
    .single()

  if (ticketError || !ticket) {
    return { ok: false, error: ticketError?.message ?? 'Failed to create ticket' }
  }

  await supabase
    .from('assistance_sessions')
    .update({
      status: 'escalated',
      category: summary.category,
      escalation_reason: input.escalationReason,
      ticket_id: ticket.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  await supabase.from('assistance_messages').insert([
    {
      session_id: sessionId,
      role: 'system',
      content: CONNECTED_MESSAGE,
      metadata: { escalationSuggested: false, escalationReason: input.escalationReason },
    },
  ])

  await notifySupportEscalation({
    userId: user.id,
    ticketId: String(ticket.id),
    ticketNumber: String(ticket.ticket_number),
    issue: summary.issue,
  })

  revalidatePath('/support')
  revalidatePath('/admin/support')
  revalidatePath('/admin/support/messages')

  return {
    ok: true,
    sessionId,
    ticketId: String(ticket.id),
    ticketNumber: String(ticket.ticket_number),
    summary,
    connectedMessage: CONNECTED_MESSAGE,
  }
}

export async function resolveAssistanceSession(sessionId: string) {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false as const, error: 'Not authenticated' }

  const { error } = await supabase
    .from('assistance_sessions')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

export async function uploadAssistanceAttachment(formData: FormData): Promise<{
  ok: boolean
  attachment?: AssistanceAttachment
  error?: string
}> {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'No file provided' }
  if (file.size > MAX_ATTACHMENT_SIZE) return { ok: false, error: 'File too large (max 20MB)' }
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return { ok: false, error: 'Unsupported file type' }
  }

  const bucketReady = await ensureAssistanceStorageBucket()
  if (!bucketReady.ok) {
    return { ok: false, error: bucketReady.error ?? 'Storage unavailable' }
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(ASSISTANCE_ATTACHMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    attachment: {
      name: file.name,
      path,
      mimeType: file.type,
      size: file.size,
    },
  }
}

export async function getAssistanceSignedUrl(path: string): Promise<string | null> {
  const { supabase, user } = await requireAuthUser()
  if (!user) return null
  if (!path.startsWith(`${user.id}/`)) return null

  const { data, error } = await supabase.storage
    .from(ASSISTANCE_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function pollAssistanceMessages(
  sessionId: string,
  knownIds: string[]
): Promise<{
  ok: boolean
  messages?: AssistanceMessage[]
  error?: string
}> {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: session } = await supabase
    .from('assistance_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!session) return { ok: false, error: 'Session not found' }

  const { data: rows, error } = await supabase
    .from('assistance_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }

  const known = new Set(knownIds)
  const messages = (rows ?? [])
    .map(mapMessage)
    .filter((m) => !known.has(m.id))

  return { ok: true, messages }
}

export async function updateAssistanceCategory(sessionId: string, category: string) {
  const { supabase, user } = await requireAuthUser()
  if (!user) return { ok: false as const, error: 'Not authenticated' }

  await supabase
    .from('assistance_sessions')
    .update({ category, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  return { ok: true as const }
}

export async function sendEscalatedUserMessage(input: {
  sessionId: string
  content: string
  attachments?: AssistanceAttachment[]
}) {
  return saveAssistanceMessage({
    sessionId: input.sessionId,
    role: 'user',
    content: input.content,
    metadata: input.attachments?.length ? { attachments: input.attachments } : {},
  })
}
