'use client'

import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Share2, Shield, Trophy } from 'lucide-react'
import { StatusCardGrid, statusCardSurfaceClass } from '@/components/shared/status-cards'
import { getMfaStatus, type MfaStatus } from '@/lib/auth/mfa'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import type { LearningProgress, ReferralData, RewardsData } from '@/lib/data/types'

interface DashboardStatusCardsProps {
  rewards?: RewardsData | null
  referral?: ReferralData | null
  learning?: LearningProgress | null
}

export default function DashboardStatusCards({
  rewards,
  referral,
  learning,
}: DashboardStatusCardsProps) {
  const t = useTranslations('dashboard')
  const tSettings = useTranslations('settings')
  const kycAccess = useFinancialKycAccess()
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>({ enabled: false, provider: null })

  useEffect(() => {
    let active = true
    getMfaStatus()
      .then((status) => {
        if (active) setMfaStatus(status)
      })
      .catch(() => {
        if (active) setMfaStatus({ enabled: false, provider: null })
      })
    return () => {
      active = false
    }
  }, [])

  const kycVerified = kycAccess.verified
  const securityItemsComplete = (mfaStatus.enabled ? 1 : 0) + (kycVerified ? 1 : 0)

  return (
    <StatusCardGrid columns={4}>
      <div className={statusCardSurfaceClass}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Trophy className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="text-xs font-bold text-gray-900">{t('rewardsProgress')}</h3>
        </div>
        <p className="text-base font-bold text-gray-900">{rewards?.currentTier ?? 'Bronze Level'}</p>
        <p className="mt-0.5 text-[10px] text-gray-500">{rewards?.points ?? '0 / 500 XP'}</p>
        <p className="mt-1 text-[10px] text-gray-400">{rewards?.nextLevel ?? 'Next: Silver Level'}</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${rewards?.progress ?? 0}%` }}
          />
        </div>
      </div>

      <div className={statusCardSurfaceClass}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Share2 className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-xs font-bold text-gray-900">{t('referralEarnings')}</h3>
        </div>
        <p className="text-base font-bold text-emerald-600">{referral?.totalEarnings ?? '$0.00'}</p>
        <p className="mt-0.5 text-[10px] text-gray-500">{t('totalEarnings')}</p>
        <p className="mt-2 text-[10px] text-gray-500">
          {t('totalReferrals', { count: referral?.totalReferrals ?? 0 })}
        </p>
        <Link
          href="/referral"
          className="mt-3 inline-block text-[11px] font-semibold text-[#0052ff] hover:underline"
        >
          {t('viewDetails')}
        </Link>
      </div>

      <div className={statusCardSurfaceClass}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <BookOpen className="h-4 w-4 text-[#0052ff]" />
          </div>
          <h3 className="text-xs font-bold text-gray-900">{t('learningProgress')}</h3>
        </div>
        <p className="text-base font-bold text-emerald-600">{learning?.completed ?? 0}%</p>
        <p className="mt-0.5 text-[10px] text-gray-500">{t('overallProgress')}</p>
        <p className="mt-2 text-[10px] text-gray-500">
          {learning?.coursesCompleted ?? 0} {learning?.label ?? t('coursesCompleted')}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${learning?.completed ?? 0}%` }}
          />
        </div>
        <Link
          href="/academy"
          className="mt-3 inline-block text-[11px] font-semibold text-[#0052ff] hover:underline"
        >
          {t('continueLearning')}
        </Link>
      </div>

      <div className={statusCardSurfaceClass}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-xs font-bold text-gray-900">{t('securityStatus')}</h3>
        </div>
        <p className="text-base font-bold text-gray-900">
          {securityItemsComplete}/2
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
          <li>
            {tSettings('twoFactor')}:{' '}
            {mfaStatus.enabled ? tSettings('active') : tSettings('off')}
          </li>
          <li>
            KYC: {kycVerified ? tSettings('active') : kycAccess.status}
          </li>
        </ul>
        <Link
          href="/settings"
          className="mt-3 inline-block text-[11px] font-semibold text-[#0052ff] hover:underline"
        >
          {t('viewDetails')}
        </Link>
      </div>
    </StatusCardGrid>
  )
}
