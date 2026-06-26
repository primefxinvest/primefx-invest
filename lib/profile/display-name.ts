/** Title-case a person's name for consistent display. */
export function formatPersonName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  return trimmed
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 2 && part === part.toUpperCase()) return part
      if (part.includes('-')) {
        return part
          .split('-')
          .map((segment) =>
            segment
              ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
              : segment
          )
          .join('-')
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(' ')
}

function nameScore(name: string): number {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length * 100 + name.trim().length
}

/** Pick the richest name source so header, profile, and DB stay aligned. */
export function resolveUserDisplayName(sources: {
  dbName?: string | null
  metadataName?: string | null
  localName?: string | null
  email?: string | null
}): string {
  const candidates = [sources.dbName, sources.metadataName, sources.localName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  if (candidates.length === 0) {
    const fallback = sources.email?.split('@')[0] ?? 'User'
    return formatPersonName(fallback)
  }

  const best = candidates.reduce((current, next) =>
    nameScore(next) > nameScore(current) ? next : current
  )

  return formatPersonName(best)
}
