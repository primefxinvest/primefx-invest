'use client'

import { useTranslations } from 'next-intl'
import { Banknote, Brain, Layers, ShieldCheck } from 'lucide-react'

const trustKeys = ['noHiddenFees', 'withdrawAnytime', 'smartDiversification', 'aiRiskManagement'] as const
const icons = {
  noHiddenFees: Banknote,
  withdrawAnytime: ShieldCheck,
  smartDiversification: Layers,
  aiRiskManagement: Brain,
}

export default function TrustFeaturesBar() {
  const t = useTranslations('invest.trust')

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:grid-cols-2 sm:gap-4 sm:px-6 sm:py-5 lg:grid-cols-4">
      {trustKeys.map((key) => {
        const Icon = icons[key]
        return (
          <div key={key} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">{t(key)}</span>
          </div>
        )
      })}
    </div>
  )
}
