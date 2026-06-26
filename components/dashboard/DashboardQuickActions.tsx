'use client'

import Link from 'next/link'
import {
  BookOpen,
  Download,
  Send,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react'

const actions = [
  {
    href: '/invest',
    label: 'Invest Now',
    description: 'Start investing',
    icon: TrendingUp,
    color: 'bg-[#0052ff]',
  },
  {
    href: '/wallet',
    label: 'Deposit',
    description: 'Add funds',
    icon: Download,
    color: 'bg-emerald-500',
  },
  {
    href: '/wallet',
    label: 'Withdraw',
    description: 'Request payout',
    icon: Upload,
    color: 'bg-orange-500',
  },
  {
    href: '/wallet',
    label: 'Transfer',
    description: 'Send to another wallet',
    icon: Send,
    color: 'bg-purple-500',
  },
  {
    href: '/primeai',
    label: 'PrimeAI',
    description: 'Ask anything',
    icon: Zap,
    color: 'bg-indigo-500',
  },
  {
    href: '/academy',
    label: 'Academy',
    description: 'Learn & grow',
    icon: BookOpen,
    color: 'bg-teal-600',
  },
]

export default function DashboardQuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map(({ href, label, description, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-4 text-center transition-colors hover:border-gray-200 hover:bg-white"
          >
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color} text-white shadow-sm`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-gray-900">{label}</p>
            <p className="mt-0.5 text-[10px] text-gray-500">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
