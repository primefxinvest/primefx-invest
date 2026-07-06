'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createUserNotification } from '@/lib/notifications/service'
import type { KycDocumentUrls, KycSubmission, KycSubmissionInput } from '@/lib/kyc/types'
import { requiresDocumentBack } from '@/lib/kyc/upload'
import { signKycDocumentPaths } from '@/lib/kyc/storage'
import { requireVerifiedEmail, EMAIL_NOT_VERIFIED_CODE } from '@/lib/auth/require-verified-email'

function mapRow(row: Record<string, unknown>): KycSubmission {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    idType: row.id_type as KycSubmission['idType'],
    idNumber: row.id_number as string,
    country: row.country as string,
    documentFrontPath: row.document_front_path as string,
    documentBackPath: (row.document_back_path as string | null) ?? null,
    selfiePath: row.selfie_path as string,
    proofOfAddressPath: (row.proof_of_address_path as string | null) ?? null,
    reviewStatus: row.review_status as KycSubmission['reviewStatus'],
    submittedAt: (row.submitted_at as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

async function requireUserId() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

function assertOwnPath(userId: string, path: string) {
  if (!path.startsWith(`${userId}/`)) {
    throw new Error('Invalid document path.')
  }
}

export async function getMyKycSubmission(): Promise<KycSubmission | null> {
  try {
    const userId = await requireUserId()
    if (!userId) return null

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return mapRow(data as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function submitKycForReview(
  input: KycSubmissionInput
): Promise<{ success: boolean; error?: string; code?: string }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  if (!userId) {
    return { success: false, error: 'You must be signed in to submit KYC.' }
  }

  const emailVerification = requireVerifiedEmail(user)
  if (!emailVerification.allowed) {
    return {
      success: false,
      error: emailVerification.error,
      code: EMAIL_NOT_VERIFIED_CODE,
    }
  }

  if (!input.idType || !input.idNumber.trim() || !input.country.trim()) {
    return { success: false, error: 'ID type, ID number, and country are required.' }
  }

  if (!input.documentFrontPath || !input.selfiePath) {
    return { success: false, error: 'Upload your ID document and a selfie.' }
  }

  if (requiresDocumentBack(input.idType) && !input.documentBackPath) {
    return { success: false, error: 'Upload the back of your ID document.' }
  }

  if (!input.proofOfAddressPath) {
    return { success: false, error: 'Upload proof of address (utility bill or bank statement).' }
  }

  try {
    assertOwnPath(userId, input.documentFrontPath)
    assertOwnPath(userId, input.selfiePath)
    if (input.documentBackPath) assertOwnPath(userId, input.documentBackPath)
    if (input.proofOfAddressPath) assertOwnPath(userId, input.proofOfAddressPath)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid document upload.',
    }
  }

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { success: false, error: 'KYC submission is temporarily unavailable.' }
  }

  const now = new Date().toISOString()

  const { error } = await admin.from('kyc_submissions').upsert(
    {
      user_id: userId,
      id_type: input.idType,
      id_number: input.idNumber.trim(),
      country: input.country.trim(),
      document_front_path: input.documentFrontPath,
      document_back_path: input.documentBackPath ?? null,
      selfie_path: input.selfiePath,
      proof_of_address_path: input.proofOfAddressPath ?? null,
      review_status: 'submitted',
      submitted_at: now,
      reviewed_at: null,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  await admin
    .from('users')
    .update({
      kyc_status: 'Pending',
      kyc_rejection_reason: null,
      kyc_submitted_at: now,
      country: input.country.trim(),
      updated_at: now,
    })
    .eq('id', userId)

  await createUserNotification({
    userId,
    title: 'KYC submitted',
    message: 'Your identity documents are under review. We will notify you when verification is complete.',
    type: 'security',
    metadata: { event: 'kyc_submitted' },
  })

  revalidatePath('/profile')
  revalidatePath('/admin/kyc')

  return { success: true }
}

export async function getKycDocumentSignedUrls(
  paths: Partial<Record<'documentFront' | 'documentBack' | 'selfie' | 'proofOfAddress', string | null>>
): Promise<KycDocumentUrls> {
  return signKycDocumentPaths(paths)
}

export async function getMyKycDocumentUrls(): Promise<KycDocumentUrls> {
  const submission = await getMyKycSubmission()
  if (!submission) {
    return {
      documentFront: null,
      documentBack: null,
      selfie: null,
      proofOfAddress: null,
    }
  }

  return getKycDocumentSignedUrls({
    documentFront: submission.documentFrontPath,
    documentBack: submission.documentBackPath,
    selfie: submission.selfiePath,
    proofOfAddress: submission.proofOfAddressPath,
  })
}
