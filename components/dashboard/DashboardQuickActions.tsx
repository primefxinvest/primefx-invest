'use client'

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
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'

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

export default function DashboardQuickActions() {
  const t = useTranslations('dashboard')
  const items = t.raw('quickActionItems') as Array<{ label: string; description: string }>

  return (
    <div className={dashboardCardClass}>
      <h2 className={dashboardSectionTitleClass}>{t('quickActions')}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6">
        {items.map(({ label, description }, index) => {
          const Icon = actionIcons[index]
          const href = actionHrefs[index]
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center rounded-lg border border-border bg-muted/30 px-2 py-3 text-center transition-colors hover:border-border hover:bg-card sm:rounded-xl sm:px-3 sm:py-3.5"
            >
              <div
                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm sm:h-10 sm:w-10 sm:rounded-xl ${actionColors[index]}`}
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </div>
              <p className="text-[11px] font-semibold text-foreground sm:text-xs">{label}</p>
              <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">{description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
