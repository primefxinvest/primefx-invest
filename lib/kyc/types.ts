export const KYC_ID_TYPES = [
  { value: 'national_id', label: 'National ID card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's license" },
] as const

export type KycIdType = (typeof KYC_ID_TYPES)[number]['value']

export type KycReviewStatus = 'draft' | 'submitted' | 'verified' | 'rejected'

export interface KycSubmission {
  id: string
  userId: string
  idType: KycIdType
  idNumber: string
  country: string
  documentFrontPath: string
  documentBackPath: string | null
  selfiePath: string
  proofOfAddressPath: string | null
  reviewStatus: KycReviewStatus
  submittedAt: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface KycSubmissionInput {
  idType: KycIdType
  idNumber: string
  country: string
  documentFrontPath: string
  documentBackPath?: string
  selfiePath: string
  proofOfAddressPath?: string
}

export interface KycDocumentUrls {
  documentFront: string | null
  documentBack: string | null
  selfie: string | null
  proofOfAddress: string | null
}

export const KYC_REQUIRED_PROFILE_FIELDS = [
  'fullName',
  'phone',
  'dateOfBirth',
  'address',
] as const
