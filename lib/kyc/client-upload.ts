'use client'

import { supabase } from '@/lib/supabase'
import { kycStoragePath, validateKycFile } from './upload'

export async function uploadKycDocument(
  file: File,
  userId: string,
  kind: 'document-front' | 'document-back' | 'selfie' | 'proof-of-address'
): Promise<string> {
  const validationError = validateKycFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const path = kycStoragePath(userId, kind, file)

  const { error } = await supabase.storage.from('kyc-documents').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  })

  if (error) {
    throw new Error(error.message || 'Failed to upload document.')
  }

  return path
}
