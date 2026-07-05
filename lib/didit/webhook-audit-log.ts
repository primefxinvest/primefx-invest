import 'server-only'

export type DiditWebhookAuditEvent =
  | 'WEBHOOK_RECEIVED'
  | 'SIGNATURE_VERIFIED'
  | 'SIGNATURE_REJECTED'
  | 'DATABASE_UPDATED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_DECLINED'
  | 'DUPLICATE_EVENT_SKIPPED'
  | 'WEBHOOK_PROCESSING_FAILED'
  | 'UNHANDLED_WEBHOOK_TYPE'

const REDACTED_KEYS = new Set([
  'secret',
  'signature',
  'signatureV2',
  'signatureRaw',
  'signatureSimple',
  'DIDIT_WEBHOOK_SECRET',
  'DIDIT_API_KEY',
])

function redactValue(key: string, value: unknown): unknown {
  if (REDACTED_KEYS.has(key)) return '[REDACTED]'
  if (typeof value === 'string' && value.length > 500) {
    return `${value.slice(0, 500)}…`
  }
  return value
}

export function logDiditWebhookAudit(
  event: DiditWebhookAuditEvent,
  data: Record<string, unknown> = {}
) {
  const safeData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, redactValue(key, value)])
  )

  console.info(
    JSON.stringify({
      event,
      component: 'didit-webhook',
      timestamp: new Date().toISOString(),
      ...safeData,
    })
  )
}
