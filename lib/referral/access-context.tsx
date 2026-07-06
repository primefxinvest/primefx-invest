'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { ReferralAccessState } from '@/lib/referral/settings'

const DEFAULT_ACCESS: ReferralAccessState = {
  globalEnabled: true,
  userEnabled: true,
  canAccess: true,
}

const ReferralAccessContext = createContext<ReferralAccessState>(DEFAULT_ACCESS)

export function ReferralAccessProvider({
  access,
  children,
}: {
  access: ReferralAccessState
  children: ReactNode
}) {
  return (
    <ReferralAccessContext.Provider value={access}>{children}</ReferralAccessContext.Provider>
  )
}

export function useReferralAccess() {
  return useContext(ReferralAccessContext)
}
