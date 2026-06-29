import 'server-only'

export const DIDIT_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300

function normalizeEnv(raw: string | undefined): string {
  if (!raw) return ''
  let value = raw.replace(/^\uFEFF/, '').replace(/\r/g, '').trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value
}

export function getDiditWebhookSecret(): string | null {
  const secret = normalizeEnv(process.env.DIDIT_WEBHOOK_SECRET)
  return secret || null
}

export function getDiditApiKey(): string | null {
  const key = normalizeEnv(process.env.DIDIT_API_KEY)
  return key || null
}

export function getDiditWorkflowId(): string | null {
  const id = normalizeEnv(process.env.DIDIT_WORKFLOW_ID)
  return id || null
}

export function getDiditVerificationBaseUrl(): string {
  return (
    normalizeEnv(process.env.NEXT_VERIFICATION_BASE_URL) || 'https://verification.didit.me'
  ).replace(/\/$/, '')
}

export function getVerificationCallbackUrl(): string {
  const explicit = normalizeEnv(process.env.NEXT_PUBLIC_VERIFICATION_CALLBACK_URL)
  if (explicit) return explicit

  const appUrl = normalizeEnv(process.env.NEXT_PUBLIC_APP_URL) || 'http://localhost:3000'
  return `${appUrl.replace(/\/$/, '')}/verify/callback`
}
