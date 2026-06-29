import { routing, type AppLocale } from '@/i18n/routing'

export const LOCALE_EXEMPT_PREFIXES = ['/api', '/admin', '/auth'] as const

export function shouldSkipLocalePrefix(pathname: string): boolean {
  const normalized = stripLocalePrefix(pathname.startsWith('/') ? pathname : `/${pathname}`)
  return LOCALE_EXEMPT_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  )
}

export function getLocaleFromPathname(pathname: string): AppLocale {
  const segment = pathname.split('/')[1]
  if (routing.locales.includes(segment as AppLocale)) {
    return segment as AppLocale
  }
  return routing.defaultLocale
}

export function stripLocalePrefix(pathname: string): string {
  let result = pathname.startsWith('/') ? pathname : `/${pathname}`

  while (true) {
    const segments = result.split('/')
    const maybeLocale = segments[1]

    if (routing.locales.includes(maybeLocale as AppLocale)) {
      const rest = segments.slice(2).join('/')
      result = rest ? `/${rest}` : '/'
      continue
    }

    break
  }

  return result
}

export function localizePath(path: string, locale: AppLocale): string {
  const normalized = stripLocalePrefix(path.startsWith('/') ? path : `/${path}`)
  if (locale === routing.defaultLocale || shouldSkipLocalePrefix(normalized)) {
    return normalized
  }
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`
}
