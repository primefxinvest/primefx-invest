'use client'

import { useTranslations } from 'next-intl'
import { HowItWorksSteps } from '@/components/ui/steps'
import { howItWorksSteps } from '@/lib/invest/plan-config'

export default function InvestHowItWorksPanel() {
  const t = useTranslations('invest.howItWorks')

  return (
    <section
      id="how-it-works"
      className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#0052ff]">{t('eyebrow')}</p>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">{t('title')}</h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-gray-500 sm:text-right sm:text-sm">
          {t('description')}
        </p>
      </div>
      <HowItWorksSteps steps={howItWorksSteps} />
    </section>
  )
}
