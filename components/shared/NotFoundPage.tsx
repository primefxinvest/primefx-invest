import { NextIntlClientProvider } from 'next-intl'
import { LocaleHtmlLang } from '@/components/i18n/LocaleHtmlLang'
import { PublicShell } from '@/components/public/PublicShell'
import { getNotFoundLocaleAndMessages } from '@/lib/i18n/not-found'
import { NotFoundView, type NotFoundVariant } from '@/components/shared/NotFoundView'

interface NotFoundPageProps {
  variant?: NotFoundVariant
  shell?: 'public' | 'none'
  nativeHomeLink?: boolean
  /** Wrap with next-intl when rendered outside app/[locale]/layout (root or admin 404). */
  withIntlProvider?: boolean
}

export async function NotFoundPage({
  variant = 'default',
  shell = 'none',
  nativeHomeLink = false,
  withIntlProvider = false,
}: NotFoundPageProps) {
  const view = <NotFoundView variant={variant} nativeHomeLink={nativeHomeLink} />
  const content = shell === 'public' ? <PublicShell>{view}</PublicShell> : view

  if (!withIntlProvider) {
    return content
  }

  const { locale, messages } = await getNotFoundLocaleAndMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlLang locale={locale} />
      {content}
    </NextIntlClientProvider>
  )
}
