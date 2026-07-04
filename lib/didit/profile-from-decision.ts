export type DiditProfileFields = {
  dateOfBirth: string | null
  address: string | null
  country: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return null
}

function formatParsedAddress(parsed: Record<string, unknown>): string | null {
  const formatted = pickString(parsed, ['formatted_address'])
  if (formatted) return formatted

  const parts = [
    parsed.street_1,
    parsed.street_2,
    parsed.city,
    parsed.region,
    parsed.postal_code,
    parsed.country,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())

  return parts.length > 0 ? parts.join(', ') : null
}

function extractFromIdVerification(record: Record<string, unknown>): DiditProfileFields {
  const dateOfBirth = pickString(record, ['date_of_birth', 'birth_date'])
  let address = pickString(record, ['formatted_address', 'address'])

  const parsed = record.parsed_address
  if (!address && isRecord(parsed)) {
    address = formatParsedAddress(parsed)
  }

  let country: string | null = null
  if (isRecord(parsed)) {
    country = pickString(parsed, ['country'])
  }
  if (!country) {
    country = pickString(record, ['nationality', 'issuing_state', 'country', 'place_of_birth'])
  }

  return { dateOfBirth, address, country }
}

function extractFromPoaVerification(record: Record<string, unknown>): DiditProfileFields {
  let address = pickString(record, ['poa_address', 'formatted_address', 'address'])

  const parsed = record.poa_parsed_address ?? record.parsed_address
  if (!address && isRecord(parsed)) {
    address = formatParsedAddress(parsed)
  }

  let country: string | null = null
  if (isRecord(parsed)) {
    country = pickString(parsed, ['country'])
  }

  return { dateOfBirth: null, address, country }
}

function mergeProfileFields(
  current: DiditProfileFields,
  next: DiditProfileFields
): DiditProfileFields {
  return {
    dateOfBirth: current.dateOfBirth ?? next.dateOfBirth,
    address: current.address ?? next.address,
    country: current.country ?? next.country,
  }
}

function collectVerificationEntries(
  decision: Record<string, unknown>,
  key: string
): Record<string, unknown>[] {
  const value = decision[key]
  if (!Array.isArray(value)) return []
  return value.filter(isRecord)
}

/** Extract DOB, address, and country from Didit decision / id_verifications / poa payloads. */
export function extractProfileFieldsFromDiditDecision(
  decision: Record<string, unknown> | null | undefined
): DiditProfileFields {
  const empty: DiditProfileFields = { dateOfBirth: null, address: null, country: null }
  if (!isRecord(decision)) return empty

  let fields = { ...empty }

  for (const entry of collectVerificationEntries(decision, 'id_verifications')) {
    fields = mergeProfileFields(fields, extractFromIdVerification(entry))
    if (fields.dateOfBirth && fields.address && fields.country) {
      return fields
    }
  }

  for (const entry of collectVerificationEntries(decision, 'poa_verifications')) {
    fields = mergeProfileFields(fields, extractFromPoaVerification(entry))
  }

  return fields
}

export function hasDiditProfileFields(fields: DiditProfileFields): boolean {
  return Boolean(fields.dateOfBirth || fields.address || fields.country)
}

export function formatDiditDateForProfile(value: string): string {
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const date = new Date(`${trimmed}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return trimmed
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
