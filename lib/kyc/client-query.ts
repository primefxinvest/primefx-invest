import { supabase } from '@/lib/supabase'
import type { KycSubmission } from './types'

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

export async function fetchMyKycSubmission(userId: string): Promise<KycSubmission | null> {
  try {
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
