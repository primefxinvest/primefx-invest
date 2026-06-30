import { ReferralProgramView } from '@/components/referral/ReferralProgramView'
import { ReferralProgramGate } from '@/components/referral/ReferralProgramGate'
import { fetchReferralProgramOverviewServer } from '@/lib/referral/overview-server'
import { ensureUserReferralCode } from '@/lib/referral/server'
import { getReferralAccessForUser } from '@/lib/referral/settings'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ReferralPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const access = user
    ? await getReferralAccessForUser(user.id)
    : { globalEnabled: false, userEnabled: false, canAccess: false }

  let initialOverview = null

  if (access.canAccess && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, referral_code')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.referral_code) {
      await ensureUserReferralCode(user.id, profile?.full_name as string | undefined)
    }

    initialOverview = await fetchReferralProgramOverviewServer(user.id)
  }

  return (
    <ReferralProgramGate>
      {access.canAccess ? <ReferralProgramView initialOverview={initialOverview} /> : null}
    </ReferralProgramGate>
  )
}
