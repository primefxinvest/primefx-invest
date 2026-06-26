import { z } from 'zod'

export const kycExtractedFieldsSchema = z.object({
  fullName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  address: z.string().nullable(),
  idNumber: z.string().nullable(),
  country: z.string().nullable(),
  idType: z.enum(['national_id', 'passport', 'drivers_license']).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string().nullable().optional(),
})

export type KycExtractedFields = z.infer<typeof kycExtractedFieldsSchema>

export type KycDocumentScanKind = 'id_front' | 'proof_of_address'
