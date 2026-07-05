'use client'

import { Link } from '@/i18n/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, ChevronRight, Share2, Shield, Trophy } from 'lucide-react'
import { StatusCardGrid, statusCardSurfaceClass } from '@/components/shared/status-cards'
import { getMfaStatus, type MfaStatus } from '@/lib/auth/mfa'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import type { LearningProgress, ReferralData, RewardsData } from '@/lib/data/types'
import { cn } from '@/lib/utils'

interface DashboardStatusCardsProps {
  rewards?: RewardsData | null
  referral?: ReferralData | null
  learning?: LearningProgress | null
}

function InsightCard({
  icon,
  iconBg,
  title,
  children,
  href,
  linkLabel,
}: {
  icon: ReactNode
  iconBg: string
  title: string
  children: ReactNode
  href?: string
  linkLabel?: string
}) {
  return (
    <div className={cn(statusCardSurfaceClass, 'flex h-full flex-col')}>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
        <h3 className="text-xs font-semibold text-foreground sm:text-sm">{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {linkLabel}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  )
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
    <StatusCardGrid columns={4} className="grid-cols-2 xl:grid-cols-4">
      <InsightCard
        icon={<Trophy className="h-4 w-4 text-orange-500" aria-hidden />}
        iconBg="bg-orange-50"
        title={t('rewardsProgress')}
        href="/rewards"
        linkLabel={t('viewDetails')}
      >
        <p className="text-lg font-bold text-foreground">{rewards?.currentTier ?? 'Bronze Level'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{rewards?.points ?? '0 / 500 XP'}</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#f97316] transition-all"
            style={{ width: `${rewards?.progress ?? 0}%` }}
          />
        </div>
      </InsightCard>

      <InsightCard
        icon={<Share2 className="h-4 w-4 text-emerald-600" aria-hidden />}
        iconBg="bg-emerald-50"
        title={t('referralEarnings')}
        href="/referral"
        linkLabel={t('viewDetails')}
      >
        <p className="text-lg font-bold text-emerald-600">{referral?.totalEarnings ?? '$0.00'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('totalEarnings')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('totalReferrals', { count: referral?.totalReferrals ?? 0 })}
        </p>
      </InsightCard>

      <InsightCard
        icon={<BookOpen className="h-4 w-4 text-primary" aria-hidden />}
        iconBg="bg-primary/10"
        title={t('learningProgress')}
        href="/academy"
        linkLabel={t('continueLearning')}
      >
        <p className="text-lg font-bold text-emerald-600">{learning?.completed ?? 0}%</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('overallProgress')}</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${learning?.completed ?? 0}%` }}
          />
        </div>
      </InsightCard>

      <InsightCard
        icon={<Shield className="h-4 w-4 text-emerald-600" aria-hidden />}
        iconBg="bg-emerald-50"
        title={t('securityStatus')}
        href="/settings"
        linkLabel={t('viewDetails')}
      >
        <p className="text-lg font-bold text-foreground">{securityItemsComplete}/2</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>
            {tSettings('twoFactor')}: {mfaStatus.enabled ? tSettings('active') : tSettings('off')}
          </li>
          <li>KYC: {kycVerified ? tSettings('active') : kycAccess.status}</li>
        </ul>
      </InsightCard>
    </StatusCardGrid>
  )
}
