import { KYC_ID_TYPES, type KycIdType } from './types'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function validateKycFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Use JPG, PNG, WebP, or PDF files only.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Each file must be smaller than 10 MB.'
  }
  return null
}

export function kycStoragePath(userId: string, kind: string, file: File) {
  const ext =
    file.type === 'application/pdf'
      ? 'pdf'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'webp'
          : 'jpg'
  return `${userId}/${kind}.${ext}`
}

export function requiresDocumentBack(idType: KycIdType) {
  return idType === 'national_id' || idType === 'drivers_license'
}

export function getIdTypeLabel(value: string) {
  return KYC_ID_TYPES.find((item) => item.value === value)?.label ?? value
}
