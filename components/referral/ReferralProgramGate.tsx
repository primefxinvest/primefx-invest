'use client'

import { Loader2 } from 'lucide-react'
import { useReferralProgramEnabled } from '@/lib/hooks/useReferralProgramEnabled'
import { ReferralLockedView } from '@/components/referral/ReferralLockedView'

interface ReferralProgramGateProps {
  children: React.ReactNode
}

export function ReferralProgramGate({ children }: ReferralProgramGateProps) {
  const { canAccess, globalEnabled, userEnabled, loading } = useReferralProgramEnabled()

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0052ff]" />
      </div>
    )
  }

  if (!canAccess) {
    return (
      <ReferralLockedView
        globalEnabled={globalEnabled}
        userEnabled={userEnabled}
      />
    )
  }

  return children
}
