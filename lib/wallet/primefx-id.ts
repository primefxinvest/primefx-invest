export function formatPrimeFxId(userId: string): string {
  return `PFX${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Hex prefix after optional PFX prefix — used for short PrimeFx ID lookup. */
export function transferUserIdPrefix(query: string): string {
  return query.trim().replace(/^PFX/i, '').toLowerCase()
}

/** True when input is a full user UUID (with or without dashes), not a PrimeFx ID. */
export function isRawUserUuidQuery(query: string): boolean {
  const trimmed = query.trim()
  if (UUID_RE.test(trimmed)) return true

  const hex = transferUserIdPrefix(trimmed)
  return /^[0-9a-f]{32}$/i.test(hex)
}

/** Normalize a PrimeFx ID search query to a hex prefix, or null if invalid. */
export function parsePrimeFxIdPrefix(query: string): string | null {
  const trimmed = query.trim()
  if (!trimmed || isRawUserUuidQuery(trimmed)) return null

  const prefix = transferUserIdPrefix(trimmed)
  if (prefix.length < 4) return null

  return prefix
}

