import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

export default async function PrivacyPage() {
  const locale = (await getLocale()) as AppLocale
  redirect({ href: '/legal#privacy', locale })
}
