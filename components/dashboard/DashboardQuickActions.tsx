'use client'

import { memo } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  BookOpen,
  Download,
  Send,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { dashboardCardClass } from '@/lib/layout/surfaces'

const actionHrefs = [
  '/invest',
  '/wallet/deposit',
  '/wallet/withdraw',
  '/wallet/transfer',
  '/primeai',
  '/academy',
]
const actionIcons = [TrendingUp, Download, Upload, Send, Zap, BookOpen]
const actionColors = [
  'bg-primary',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-teal-600',
]

function DashboardQuickActions() {
  const t = useTranslations('dashboard')
  const items = t.raw('quickActionItems') as Array<{ label: string; description: string }>

  return (
    <section aria-labelledby="dashboard-quick-actions-heading" className={dashboardCardClass}>
      <DashboardSectionHeader title={t('quickActions')} className="mb-0" />
      <h2 id="dashboard-quick-actions-heading" className="sr-only">
        {t('quickActions')}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ label, description }, index) => {
          const Icon = actionIcons[index]
          const href = actionHrefs[index]
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center rounded-xl border border-border bg-muted/30 px-2 py-3 text-center transition-colors hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-3 sm:py-3.5"
            >
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${actionColors[index]}`}
                aria-hidden
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">{description}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default memo(DashboardQuickActions)
