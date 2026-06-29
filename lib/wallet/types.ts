export type TransferRecipientMethod = 'email' | 'username' | 'id'

export interface TransferRecipientPreview {
  id: string
  email: string
  fullName: string | null
  primeFxId: string
  kycVerified: boolean
}
