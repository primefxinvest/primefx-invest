import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { fetchPublicInvestmentPlans } from '@/lib/invest/public-plans'
import {
  formatPlanDisplayName,
} from '@/lib/invest/plan-mapper'
import { getLandingPlanTheme } from '@/lib/invest/plan-config'

function InvestmentPlansSectionSkeleton() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-8 w-full max-w-xs animate-pulse rounded bg-gray-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5"
              >
                <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
                <div className="mt-3 h-5 w-20 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-4 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="mt-4 h-8 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 3 }).map((__, row) => (
                    <div key={row} className="h-3 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
                <div className="mt-5 h-10 animate-pulse rounded-lg bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { InvestmentPlansSectionSkeleton }

export default async function InvestmentPlansSection() {
  const t = await getTranslations('landing.plans')
  const plans = await fetchPublicInvestmentPlans()

  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">{t('eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">{t('title')}</h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{t('subtitle')}</p>
            <Link
              href="/invest"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              {t('compare')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-8 lg:col-span-3">
              <p className="text-center text-sm text-gray-500">{t('empty')}</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
            {plans.map((plan, index) => {
              const theme = getLandingPlanTheme(plan, index)
              const Icon = theme.icon
              const displayDuration =
                plan.duration === 'No Lock Period' ? t('flexible') : plan.duration

              return (
                <div
                  key={plan.id}
                  className={cn('relative flex flex-col rounded-2xl border p-5', theme.card)}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-[10px] font-bold text-white">
                      {t('mostPopular')}
                    </span>
                  )}

                  <div
                    className={cn(
                      'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
                      theme.iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-bold text-gray-900">
                    {formatPlanDisplayName(plan.name)}
                  </h3>

                  <span
                    className={cn(
                      'mt-1.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      theme.badge
                    )}
                  >
                    {plan.category}
                  </span>

                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">{plan.weeklyRoi}</p>
                    <p className="text-xs text-gray-500">{plan.weeklyRoiLabel}</p>
                  </div>

                  <ul className="mt-4 flex-1 space-y-2">
                    <li className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('minInvestment')}</span>
                      <span className="font-semibold text-gray-800">{plan.minInvestment}</span>
                    </li>
                    <li className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('duration')}</span>
                      <span className="font-semibold text-gray-800">{displayDuration}</span>
                    </li>
                    <li className="flex justify-between text-xs">
                      <span className="text-gray-500">{t('capitalProtection')}</span>
                      <span className="font-semibold text-gray-800">{t('capitalProtectionYes')}</span>
                    </li>
                  </ul>

                  <Link
                    href={`/signup?plan=${plan.id}`}
                    className={cn(
                      'mt-5 block rounded-lg border-2 py-2 text-center text-sm font-semibold transition-colors',
                      theme.buttonClass
                    )}
                  >
                    {t('choosePlan')}
                  </Link>
                </div>
              )
            })}
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
