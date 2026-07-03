'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
