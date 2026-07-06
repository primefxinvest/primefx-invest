import { ReferralProgramView } from '@/components/referral/ReferralProgramView'
import { fetchReferralProgramOverviewServer } from '@/lib/referral/overview-server'
import { ensureUserReferralCode } from '@/lib/referral/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'

export default async function ReferralPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const locale = (await getLocale()) as AppLocale
    redirect({ href: '/login', locale })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, referral_code')
    .eq('id', user!.id)
    .maybeSingle()

  if (!profile?.referral_code) {
    await ensureUserReferralCode(user!.id, profile?.full_name as string | undefined)
  }

  const initialOverview = await fetchReferralProgramOverviewServer(user!.id)

  return <ReferralProgramView initialOverview={initialOverview} />
}
