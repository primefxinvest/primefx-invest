import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

import type { TransferRecipientMethod, TransferRecipientPreview } from './types'
import { formatPrimeFxId } from '@/lib/wallet/primefx-id'

export type { TransferRecipientMethod, TransferRecipientPreview }

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for wallet transfers.')
  }
  return db
}

function mapRecipient(row: {
  id: string
  email: string
  full_name: string | null
  kyc_status: string | null
}): TransferRecipientPreview {
  const kyc = String(row.kyc_status ?? 'pending').toLowerCase()
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    primeFxId: formatPrimeFxId(row.id),
    kycVerified: kyc === 'verified',
  }
}

export async function lookupTransferRecipient(
  method: TransferRecipientMethod,
  query: string
): Promise<TransferRecipientPreview | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const db = getDb()

  if (method === 'email') {
    const email = trimmed.toLowerCase()
    if (!email.includes('@')) return null

    const { data, error } = await db
      .from('users')
      .select('id, email, full_name, kyc_status')
      .ilike('email', email)
      .maybeSingle()

    if (error || !data) return null
    return mapRecipient(data as { id: string; email: string; full_name: string | null; kyc_status: string | null })
  }

  if (method === 'username') {
    const handle = trimmed.replace(/^@/, '').toLowerCase()
    const { data, error } = await db
      .from('users')
      .select('id, email, full_name, kyc_status')
      .ilike('email', `${handle}@%`)
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      return mapRecipient(data as { id: string; email: string; full_name: string | null; kyc_status: string | null })
    }

    const { data: byName, error: nameError } = await db
      .from('users')
      .select('id, email, full_name, kyc_status')
      .ilike('full_name', `%${handle}%`)
      .limit(1)
      .maybeSingle()

    if (nameError || !byName) return null
    return mapRecipient(byName as { id: string; email: string; full_name: string | null; kyc_status: string | null })
  }

  const rawId = trimmed.replace(/^PFX/i, '').toLowerCase()
  if (!rawId) return null

  const { data: users, error } = await db
    .from('users')
    .select('id, email, full_name, kyc_status')

  if (error || !users?.length) return null

  const match = users.find((row) =>
    String(row.id).replace(/-/g, '').toLowerCase().startsWith(rawId)
  )

  if (!match) return null
  return mapRecipient(match as { id: string; email: string; full_name: string | null; kyc_status: string | null })
}
