export type EmailVerificationStatus = {
  email: string
  verified: boolean
  lastSentAt: string | null
  resendCooldownSeconds: number
}

export type EmailVerificationActionResult =
  | { success: true }
  | { success: false; error: string; code?: string; retryAfterSeconds?: number }
