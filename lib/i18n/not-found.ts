import { headers } from 'next/headers'
import { getLocaleFromPathname } from '@/lib/i18n/pathname'
import { routing, type AppLocale } from '@/i18n/routing'

export async function getNotFoundLocaleAndMessages() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/'
  const locale = getLocaleFromPathname(pathname)

  if (!routing.locales.includes(locale)) {
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`)).default,
      pathname,
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    pathname,
  }
}

export async function getNotFoundMetadata(locale: AppLocale = routing.defaultLocale) {
  const messages = (await import(`../../messages/${locale}.json`)).default as {
    errors: { notFoundTitle: string; notFoundDescription: string }
  }

  return {
    title: messages.errors.notFoundTitle,
    description: messages.errors.notFoundDescription,
  }
}
