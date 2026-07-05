import { getRequestConfig } from 'next-intl/server'
import { routing, type AppLocale } from './routing'
import { deepMergeMessages } from '@/lib/i18n/message-merge'
import enMessages from '../messages/en.json'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as AppLocale)) {
    locale = routing.defaultLocale
  }

  if (locale === routing.defaultLocale) {
    return {
      locale,
      messages: enMessages,
    }
  }

  const localeMessages = (await import(`../messages/${locale}.json`)).default
  const messages = deepMergeMessages(enMessages, localeMessages)

  return {
    locale,
    messages,
  }
})
