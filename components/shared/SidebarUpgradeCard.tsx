'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { loadInvestmentPlans } from '@/lib/invest/plan-actions'
import { getCurrentUser } from '@/lib/supabase'
import { getUpgradeOffer, type UpgradeOffer } from '@/lib/invest/upgrade'

export default function SidebarUpgradeCard() {
  const [offer, setOffer] = useState<UpgradeOffer | null>(null)
  const { data: plans = [] } = useAsyncData(() => loadInvestmentPlans(), [])

  useEffect(() => {
    let active = true

    async function loadOffer() {
      const { data: user } = await getCurrentUser()
      const tier =
        (user?.user_metadata?.investor_tier as string | undefined) ??
        (user?.user_metadata?.tier as string | undefined) ??
        'Starter'

      if (!active || !plans.length) return
      setOffer(getUpgradeOffer(tier, plans))
    }

    loadOffer()

    return () => {
      active = false
    }
  }, [plans])

  if (!offer) return null

  return (
    <div className="shrink-0 border-t border-gray-200 px-3 py-3">
      <div className="rounded-xl bg-gradient-to-br from-[#0052ff] to-[#1a6bff] p-4 text-white shadow-md">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold">Upgrade to {offer.nextTierLabel}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-blue-100">{offer.description}</p>
        <Link
          href={`/invest?plan=${offer.nextPlanId}`}
          className="mt-3 block w-full rounded-lg bg-white py-2 text-center text-xs font-semibold text-[#0052ff] transition-colors hover:bg-blue-50"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  )
}
