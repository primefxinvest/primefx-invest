import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type { KycDocumentUrls } from './types'

const BUCKET = 'kyc-documents'

export async function signKycDocumentPaths(
  paths: Partial<Record<'documentFront' | 'documentBack' | 'selfie' | 'proofOfAddress', string | null>>
): Promise<KycDocumentUrls> {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      documentFront: null,
      documentBack: null,
      selfie: null,
      proofOfAddress: null,
    }
  }

  const client = admin

  async function sign(path: string | null | undefined) {
    if (!path) return null
    const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 3600)
    if (error || !data?.signedUrl) return null
    return data.signedUrl
  }

  return {
    documentFront: await sign(paths.documentFront),
    documentBack: await sign(paths.documentBack),
    selfie: await sign(paths.selfie),
    proofOfAddress: await sign(paths.proofOfAddress),
  }
}
