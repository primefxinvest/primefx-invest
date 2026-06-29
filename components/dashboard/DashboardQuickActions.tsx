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

const actionHrefs = ['/invest', '/wallet', '/wallet', '/wallet', '/primeai', '/academy']
const actionIcons = [TrendingUp, Download, Upload, Send, Zap, BookOpen]
const actionColors = [
  'bg-[#0052ff]',
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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-gray-900">{t('quickActions')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ label, description }, index) => {
          const Icon = actionIcons[index]
          const href = actionHrefs[index]
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-4 text-center transition-colors hover:border-gray-200 hover:bg-white"
            >
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${actionColors[index]} text-white shadow-sm`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-gray-900">{label}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
