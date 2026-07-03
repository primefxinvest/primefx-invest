import 'server-only'

import {
  INVESTMENT_TERMS_SECTIONS,
  INVESTMENT_TERMS_VERSION,
  buildInvestmentTermsPlainText,
} from '@/lib/legal/investment-terms'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createUserNotification } from '@/lib/notifications/service'

export { INVESTMENT_TERMS_VERSION, INVESTMENT_TERMS_SECTIONS, buildInvestmentTermsPlainText }

function getDb() {
  return createAdminSupabaseClient()
}

export async function ensurePlatformTermsPublished() {
  const db = getDb()
  if (!db) return

  const content = buildInvestmentTermsPlainText()
  await db.from('platform_terms').upsert(
    {
      version: INVESTMENT_TERMS_VERSION,
      title: 'PrimeFx Invest — Investment Terms and Fees',
      content,
      requires_acknowledgement: true,
      published_at: new Date().toISOString(),
    },
    { onConflict: 'version' }
  )
}

export async function getLatestTermsVersion() {
  return INVESTMENT_TERMS_VERSION
}

export async function userNeedsTermsAcknowledgement(userId: string): Promise<{
  required: boolean
  version: string
}> {
  await ensurePlatformTermsPublished()

  const version = INVESTMENT_TERMS_VERSION
  const db = getDb()
  if (!db) return { required: false, version }

  const { data } = await db
    .from('user_terms_acknowledgements')
    .select('id')
    .eq('user_id', userId)
    .eq('terms_version', version)
    .maybeSingle()

  return { required: !data, version }
}

export async function acknowledgeTerms(userId: string, version: string) {
  const db = getDb()
  if (!db) throw new Error('Terms service unavailable.')

  await db.from('user_terms_acknowledgements').upsert(
    {
      user_id: userId,
      terms_version: version,
      acknowledged_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,terms_version' }
  )
}

export async function notifyAllUsersOfTermsUpdate(message: string) {
  const db = getDb()
  if (!db) return { notified: 0 }

  await ensurePlatformTermsPublished()

  const { data: users } = await db.from('users').select('id').limit(5000)
  let notified = 0

  for (const user of users ?? []) {
    await createUserNotification({
      userId: user.id as string,
      title: 'Investment terms updated',
      message,
      type: 'general',
      metadata: { termsVersion: INVESTMENT_TERMS_VERSION },
    })
    notified += 1
  }

  return { notified }
}
