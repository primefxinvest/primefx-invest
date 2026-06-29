import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getLocale } from 'next-intl/server'
import AppLayout from '@/components/shared/AppLayout'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildPageMetadata({
  noIndex: true,
  title: 'Investor Dashboard',
  description: 'Private investor dashboard for PrimeFx Invest.',
  path: '/dashboard',
})

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const locale = (await getLocale()) as AppLocale
    redirect({ href: '/login', locale })
  }

  return <AppLayout>{children}</AppLayout>
}
