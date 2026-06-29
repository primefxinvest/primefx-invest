import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

export default async function TermsPage() {
  const locale = (await getLocale()) as AppLocale
  redirect({ href: '/legal#terms', locale })
}
