import { routing, type AppLocale } from '@/i18n/routing'

export function getLocaleFromPathname(pathname: string): AppLocale {
  const segment = pathname.split('/')[1]
  if (routing.locales.includes(segment as AppLocale)) {
    return segment as AppLocale
  }
  return routing.defaultLocale
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/')
  const maybeLocale = segments[1]

  if (routing.locales.includes(maybeLocale as AppLocale)) {
    const rest = segments.slice(2).join('/')
    return rest ? `/${rest}` : '/'
  }

  return pathname
}

export function localizePath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === routing.defaultLocale) {
    return normalized
  }
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`
}
