'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Crown } from 'lucide-react'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { loadInvestmentPlans } from '@/lib/invest/plan-actions'
import { getCurrentUser } from '@/lib/supabase'
import { getUpgradeOffer, type UpgradeOffer } from '@/lib/invest/upgrade'

export default function SidebarUpgradeCard() {
  const t = useTranslations('sidebar')
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
    <div className="shrink-0 border-t border-gray-200 px-2 py-2">
      <div className="rounded-lg bg-gradient-to-br from-[#0052ff] to-[#1a6bff] p-3 text-white shadow-md">
        <div className="flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-semibold leading-tight">
            {t('upgradeTo', { tier: offer.nextTierLabel })}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-blue-100">{offer.description}</p>
        <Link
          href={`/invest?plan=${offer.nextPlanId}`}
          className="mt-2.5 block w-full rounded-md bg-white py-1.5 text-center text-[11px] font-semibold text-[#0052ff] transition-colors hover:bg-blue-50"
        >
          {t('upgradeNow')}
        </Link>
      </div>
    </div>
  )
}
