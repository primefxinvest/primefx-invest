import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { IntlLocaleProvider } from '@/components/i18n/IntlLocaleProvider'
import { LocalePreferenceSync } from '@/components/i18n/LocalePreferenceSync'
import { routing, type AppLocale } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as AppLocale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <IntlLocaleProvider locale={locale as AppLocale} messages={messages}>
      <LocalePreferenceSync />
      {children}
    </IntlLocaleProvider>
  )
}
