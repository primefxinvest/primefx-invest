import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { INVESTMENT_PLANS, PLAN_THEME_STYLES } from '@/lib/how-primefx-works/content'
import { SectionHeader, SectionShell } from './shared'

export function HowPrimefxPlansSection() {
  return (
    <SectionShell id="investment-plans">
      <SectionHeader
        eyebrow="Plans"
        title="Investment Plans"
        subtitle="Four transparent tiers designed for different investment levels. All plans distribute profits weekly."
      />

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="bg-gray-50 px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Feature
                </th>
                {INVESTMENT_PLANS.map((plan) => {
                  const theme = PLAN_THEME_STYLES[plan.theme]
                  return (
                    <th
                      key={plan.name}
                      className={`px-4 py-3 text-center text-white ${theme.header}`}
                    >
                      <span className="text-sm font-bold">{plan.name.replace(' Plan', '')}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'Minimum Investment', key: 'minimum' as const },
                { label: 'Weekly Return', key: 'weeklyReturn' as const },
                { label: 'Payout', key: 'payout' as const },
                { label: 'Best For', key: 'bestFor' as const },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3.5 font-medium text-gray-700">{row.label}</td>
                  {INVESTMENT_PLANS.map((plan) => {
                    const theme = PLAN_THEME_STYLES[plan.theme]
                    return (
                      <td
                        key={`${plan.name}-${row.key}`}
                        className={`px-4 py-3.5 text-center text-gray-600 ${row.key === 'weeklyReturn' ? `font-semibold ${theme.accent}` : ''}`}
                      >
                        {plan[row.key]}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 sm:text-sm">
          Target returns only. Actual performance may vary. Review plan terms before investing.
        </p>
        <Link
          href="/invest"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
        >
          View all plans
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:hidden">
        {INVESTMENT_PLANS.map((plan) => {
          const theme = PLAN_THEME_STYLES[plan.theme]
          return (
            <div
              key={plan.name}
              className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-2 ${theme.ring}`}
            >
              <div className={`mb-3 inline-block rounded-lg px-3 py-1 text-xs font-bold text-white ${theme.header}`}>
                {plan.name}
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Minimum</dt>
                  <dd className="font-semibold text-gray-900">{plan.minimum}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Weekly Return</dt>
                  <dd className={`font-semibold ${theme.accent}`}>{plan.weeklyReturn}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Payout</dt>
                  <dd className="text-gray-700">{plan.payout}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">{plan.bestFor}</p>
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}
