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
import { cn } from '@/lib/utils'

const actionHrefs = [
  '/invest',
  '/wallet/deposit',
  '/wallet/withdraw',
  '/wallet/transfer',
  '/primeai',
  '/academy',
] as const

const actionIcons = [TrendingUp, Download, Upload, Send, Zap, BookOpen] as const

/** PrimeFx brand palette only — blue, purple, orange, green */
const actionColors = [
  'bg-primary text-primary-foreground',
  'bg-[#10b981] text-white',
  'bg-[#f97316] text-white',
  'bg-[#7c3aed] text-white',
  'bg-primary text-primary-foreground',
  'bg-[#7c3aed] text-white',
] as const

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
              className={cn(
                'group flex min-h-[4.75rem] flex-col items-center justify-center rounded-xl border border-border bg-muted/20 px-2 py-3 text-center transition-all',
                'hover:border-primary/20 hover:bg-card hover:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'active:scale-[0.98]'
              )}
            >
              <div
                className={cn(
                  'mb-2 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105',
                  actionColors[index]
                )}
                aria-hidden
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{description}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default memo(DashboardQuickActions)
