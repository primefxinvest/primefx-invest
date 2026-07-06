export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED'

export function isEmailNotVerifiedError(error: unknown): boolean {
  if (!error) return false
  if (typeof error === 'string') return false
  if (error instanceof Error && 'code' in error) {
    return (error as Error & { code?: string }).code === EMAIL_NOT_VERIFIED_CODE
  }
  if (typeof error === 'object' && 'code' in error) {
    return (error as { code?: string }).code === EMAIL_NOT_VERIFIED_CODE
  }
  return false
}

export function isEmailNotVerifiedResult(result: {
  success?: boolean
  error?: string
  code?: string
}): boolean {
  return result.code === EMAIL_NOT_VERIFIED_CODE
}
