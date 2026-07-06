const SUPPORT_CONTEXT_PREFIXES = ['/support', '/help', '/contact'] as const

/** Routes where the floating support widget should be visible. */
export function isSupportContextPath(pathname: string): boolean {
  const path = pathname.split('?')[0]?.replace(/\/$/, '') || '/'
  return SUPPORT_CONTEXT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
}
