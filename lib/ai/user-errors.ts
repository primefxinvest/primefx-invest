export const PRIMEAI_UNAVAILABLE_USER_MESSAGE =
  'PrimeAI is currently unavailable. Please try again in a few moments.'

export const PRIMEAI_REQUEST_FAILED_USER_MESSAGE =
  'We could not complete your request. Please try again in a few moments.'

export const AI_DOCUMENT_SCAN_UNAVAILABLE_USER_MESSAGE =
  'Document scanning is temporarily unavailable. Please enter your details manually.'

const INTERNAL_ERROR_MARKERS = [
  'gemini_api_key',
  'google_api_key',
  'google_generative_ai_api_key',
  'openai_api_key',
  'not configured',
  'requires gemini',
  'requires primeai',
  'aistudio.google.com',
  'api key',
  'apikey',
]

/** Never expose env var names or setup URLs to end users. */
export function toPrimeAiClientError(raw: string | undefined): string {
  if (!raw?.trim()) return PRIMEAI_REQUEST_FAILED_USER_MESSAGE

  let message = raw.trim()

  try {
    const parsed = JSON.parse(message) as { error?: string; message?: string }
    message = parsed.error ?? parsed.message ?? message
  } catch {
    // plain text
  }

  const lower = message.toLowerCase()
  if (INTERNAL_ERROR_MARKERS.some((marker) => lower.includes(marker))) {
    return PRIMEAI_UNAVAILABLE_USER_MESSAGE
  }

  if (lower.includes('temporarily unavailable') || lower.includes('currently unavailable')) {
    return PRIMEAI_UNAVAILABLE_USER_MESSAGE
  }

  return PRIMEAI_REQUEST_FAILED_USER_MESSAGE
}

export function toDocumentScanClientError(raw: string | undefined): string {
  if (!raw?.trim()) return AI_DOCUMENT_SCAN_UNAVAILABLE_USER_MESSAGE

  const lower = raw.toLowerCase()
  if (INTERNAL_ERROR_MARKERS.some((marker) => lower.includes(marker))) {
    return AI_DOCUMENT_SCAN_UNAVAILABLE_USER_MESSAGE
  }

  return AI_DOCUMENT_SCAN_UNAVAILABLE_USER_MESSAGE
}
