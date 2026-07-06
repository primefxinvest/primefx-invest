'use server'

import { revalidatePath } from 'next/cache'
import {
  assertModuleAccess,
  getAdminContext,
  type AdminMutationResult,
} from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { ASSISTANCE_ATTACHMENT_BUCKET, ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } from '@/lib/assistance/constants'
import { ensureAssistanceStorageBucket } from '@/lib/assistance/storage'
import { notifyAssistanceAgentReply } from '@/lib/notifications/service'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin actions.')
  }
  return db
}

function mapMessage(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    role: String(row.role),
    content: String(row.content),
    metadata: row.metadata,
    createdAt: String(row.created_at),
  }
}

export async function adminReplyAssistanceSession(
  sessionId: string,
  message: string
): Promise<AdminMutationResult & { message?: ReturnType<typeof mapMessage> }> {
  const context = await getAdminContext()
  if (!context) return { success: false, error: 'Not authorized.' }
  assertModuleAccess(context, 'support_tickets')

  const body = message.trim()
  if (!body) return { success: false, error: 'Reply message is required.' }

  const db = getDb()
  const { data: session, error: sessionError } = await db
    .from('assistance_sessions')
    .select('*, users(email, full_name)')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) return { success: false, error: sessionError.message }
  if (!session) return { success: false, error: 'Session not found.' }

  const { data: inserted, error: insertError } = await db
    .from('assistance_messages')
    .insert({
      session_id: sessionId,
      role: 'agent',
      content: body,
      metadata: {
        agentId: context.userId,
        agentName: context.email,
        readAt: null,
      },
    })
    .select('*')
    .single()

  if (insertError) return { success: false, error: insertError.message }

  await db
    .from('assistance_sessions')
    .update({
      assigned_agent_id: context.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (session.ticket_id) {
    await db.from('support_ticket_messages').insert({
      ticket_id: session.ticket_id,
      sender_type: 'admin',
      sender_id: context.userId,
      message: body,
    })

    const { data: ticketRow } = await db
      .from('support_tickets')
      .select('status, subject')
      .eq('id', session.ticket_id)
      .maybeSingle()

    const currentStatus = String(ticketRow?.status ?? 'open')
      .toLowerCase()
      .replace(/-/g, '_')

    if (currentStatus === 'open') {
      await db
        .from('support_tickets')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', session.ticket_id)
    }

    await notifyAssistanceAgentReply(
      String(session.user_id),
      sessionId,
      String(ticketRow?.subject ?? 'Support')
    )
  }

  await logAdminAction({
    context,
    module: 'support_tickets',
    action: 'assistance_session_reply',
    targetResource: sessionId,
    afterState: { messageLength: body.length },
  })

  revalidatePath('/admin/support/messages')
  revalidatePath(`/admin/support/messages/${sessionId}`)

  return { success: true, message: mapMessage(inserted) }
}

export async function adminAssignAssistanceSession(
  sessionId: string,
  agentUserId: string
): Promise<AdminMutationResult> {
  const context = await getAdminContext()
  if (!context) return { success: false, error: 'Not authorized.' }
  assertModuleAccess(context, 'support_tickets')

  const db = getDb()
  const { error } = await db
    .from('assistance_sessions')
    .update({
      assigned_agent_id: agentUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { success: false, error: error.message }

  await db
    .from('support_agents')
    .upsert({
      user_id: agentUserId,
      display_name: context.email,
      updated_at: new Date().toISOString(),
    })

  revalidatePath('/admin/support/messages')
  return { success: true }
}

export async function adminResolveAssistanceSession(sessionId: string): Promise<AdminMutationResult> {
  const context = await getAdminContext()
  if (!context) return { success: false, error: 'Not authorized.' }
  assertModuleAccess(context, 'support_tickets')

  const db = getDb()
  const { data: session, error: fetchError } = await db
    .from('assistance_sessions')
    .select('ticket_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (fetchError) return { success: false, error: fetchError.message }

  const { error } = await db
    .from('assistance_sessions')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) return { success: false, error: error.message }

  if (session?.ticket_id) {
    await db
      .from('support_tickets')
      .update({ status: 'resolved', updated_at: new Date().toISOString() })
      .eq('id', session.ticket_id)
  }

  revalidatePath('/admin/support/messages')
  return { success: true }
}

export async function adminCloseAssistanceTicket(ticketId: string): Promise<AdminMutationResult> {
  const context = await getAdminContext()
  if (!context) return { success: false, error: 'Not authorized.' }
  assertModuleAccess(context, 'support_tickets')

  const db = getDb()
  const { error } = await db
    .from('support_tickets')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/support/tickets')
  return { success: true }
}

export async function adminReopenAssistanceTicket(ticketId: string): Promise<AdminMutationResult> {
  const context = await getAdminContext()
  if (!context) return { success: false, error: 'Not authorized.' }
  assertModuleAccess(context, 'support_tickets')

  const db = getDb()
  const { error } = await db
    .from('support_tickets')
    .update({ status: 'open', updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/support/tickets')
  return { success: true }
}

export async function adminUploadAssistanceAttachment(
  sessionId: string,
  formData: FormData
): Promise<AdminMutationResult & { path?: string; signedUrl?: string }> {
  const context = await getAdminContext()
  if (!context) return { success: false, error: 'Not authorized.' }
  assertModuleAccess(context, 'support_tickets')

  const db = getDb()
  const { data: session, error: sessionError } = await db
    .from('assistance_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionError) return { success: false, error: sessionError.message }
  if (!session) return { success: false, error: 'Session not found.' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { success: false, error: 'No file provided.' }
  if (file.size > MAX_ATTACHMENT_SIZE) return { success: false, error: 'File too large (max 20MB).' }
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return { success: false, error: 'Unsupported file type.' }
  }

  const bucketReady = await ensureAssistanceStorageBucket()
  if (!bucketReady.ok) return { success: false, error: bucketReady.error ?? 'Storage unavailable.' }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${session.user_id}/${Date.now()}-admin-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await db.storage
    .from(ASSISTANCE_ATTACHMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: signed } = await db.storage
    .from(ASSISTANCE_ATTACHMENT_BUCKET)
    .createSignedUrl(path, 3600)

  return { success: true, path, signedUrl: signed?.signedUrl ?? undefined }
}
