'use client'

import { useReferralAccess } from '@/lib/referral/access-context'

export function useReferralProgramEnabled() {
  const access = useReferralAccess()

  return {
    enabled: access.canAccess,
    canAccess: access.canAccess,
    globalEnabled: access.globalEnabled,
    userEnabled: access.userEnabled,
    loading: false,
  }
}
