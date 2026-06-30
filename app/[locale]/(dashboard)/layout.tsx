import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import AppLayout from '@/components/shared/AppLayout'
import { ReferralAccessProvider } from '@/lib/referral/access-context'
import { getReferralAccessForUser } from '@/lib/referral/settings'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta')
  return buildPageMetadata({
    noIndex: true,
    title: t('dashboardTitle'),
    description: t('dashboardDescription'),
    path: '/dashboard',
  })
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const locale = (await getLocale()) as AppLocale
    redirect({ href: '/login', locale })
  }

  const referralAccess = await getReferralAccessForUser(user!.id)

  return (
    <ReferralAccessProvider access={referralAccess}>
      <AppLayout>{children}</AppLayout>
    </ReferralAccessProvider>
  )
}
