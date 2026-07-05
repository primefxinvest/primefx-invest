import 'server-only'

import { createHmac, timingSafeEqual } from 'crypto'
import { DIDIT_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS } from '@/lib/didit/env'
import { canonicalJsonStringify } from '@/lib/didit/webhook-canonical'
import type { DiditSignatureMethod, DiditWebhookEnvelope } from '@/lib/didit/webhook-types'

function safeEqualHex(expected: string, received: string): boolean {
  const a = expected.trim().toLowerCase()
  const b = received.trim().toLowerCase()
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

export function isDiditTimestampFresh(
  timestampHeader: string | null,
  toleranceSeconds = DIDIT_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS
): boolean {
  if (!timestampHeader) return false
  const timestamp = Number.parseInt(timestampHeader, 10)
  if (!Number.isFinite(timestamp)) return false
  const now = Math.floor(Date.now() / 1000)
  return Math.abs(now - timestamp) <= toleranceSeconds
}

function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
}

export function verifyDiditRawSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  const expected = hmacSha256Hex(secret, rawBody)
  return safeEqualHex(expected, signatureHeader)
}

export function verifyDiditSignatureV2(
  parsedBody: unknown,
  signatureHeader: string,
  secret: string
): boolean {
  const canonical = canonicalJsonStringify(parsedBody)
  const expected = hmacSha256Hex(secret, canonical)
  return safeEqualHex(expected, signatureHeader)
}

export function verifyDiditSignatureSimple(
  parsedBody: DiditWebhookEnvelope,
  signatureHeader: string,
  secret: string
): boolean {
  const canonical = [
    parsedBody.timestamp ?? '',
    parsedBody.session_id ?? '',
    parsedBody.status ?? '',
    parsedBody.webhook_type ?? '',
  ].join(':')
  const expected = hmacSha256Hex(secret, canonical)
  return safeEqualHex(expected, signatureHeader)
}

export interface DiditVerificationInput {
  rawBody: string
  secret: string
  timestampHeader: string | null
  signatureV2: string | null
  signatureRaw: string | null
  signatureSimple: string | null
}

export type DiditVerificationResult =
  | { ok: true; method: DiditSignatureMethod; parsed: DiditWebhookEnvelope }
  | { ok: false; reason: string; parsed?: DiditWebhookEnvelope }

function parseWebhookBody(rawBody: string): DiditWebhookEnvelope | null {
  try {
    return JSON.parse(rawBody) as DiditWebhookEnvelope
  } catch {
    return null
  }
}

export function verifyDiditWebhook(input: DiditVerificationInput): DiditVerificationResult {
  if (!isDiditTimestampFresh(input.timestampHeader)) {
    return { ok: false, reason: 'Timestamp outside allowed window' }
  }

  const hasSignature = Boolean(
    input.signatureRaw || input.signatureV2 || input.signatureSimple
  )
  if (!hasSignature) {
    return { ok: false, reason: 'Missing signature header' }
  }

  // X-Signature (raw body): verify before any JSON parsing.
  if (input.signatureRaw) {
    if (verifyDiditRawSignature(input.rawBody, input.signatureRaw, input.secret)) {
      const parsed = parseWebhookBody(input.rawBody)
      if (!parsed) {
        return { ok: false, reason: 'Invalid JSON body' }
      }
      return { ok: true, method: 'raw', parsed }
    }
  }

  // X-Signature-V2 and X-Signature-Simple require canonical parsed payload.
  const parsed = parseWebhookBody(input.rawBody)
  if (!parsed) {
    return { ok: false, reason: 'Invalid JSON body' }
  }

  if (input.signatureV2 && verifyDiditSignatureV2(parsed, input.signatureV2, input.secret)) {
    return { ok: true, method: 'v2', parsed }
  }

  if (
    input.signatureSimple &&
    verifyDiditSignatureSimple(parsed, input.signatureSimple, input.secret)
  ) {
    return { ok: true, method: 'simple', parsed }
  }

  return { ok: false, reason: 'Invalid signature', parsed }
}
