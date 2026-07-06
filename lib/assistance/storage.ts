import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { ASSISTANCE_ATTACHMENT_BUCKET, ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } from '@/lib/assistance/constants'

export async function ensureAssistanceStorageBucket(): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { ok: false, error: 'Storage service unavailable' }
  }

  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) {
    return { ok: false, error: listError.message }
  }

  const exists = buckets?.some((b) => b.id === ASSISTANCE_ATTACHMENT_BUCKET)
  if (exists) {
    return { ok: true }
  }

  const { error: createError } = await admin.storage.createBucket(ASSISTANCE_ATTACHMENT_BUCKET, {
    public: false,
    fileSizeLimit: MAX_ATTACHMENT_SIZE,
    allowedMimeTypes: [...ALLOWED_ATTACHMENT_TYPES],
  })

  if (createError) {
    return { ok: false, error: createError.message }
  }

  return { ok: true }
}
