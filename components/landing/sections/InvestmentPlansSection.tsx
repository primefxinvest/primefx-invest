import Link from 'next/link'
import { ArrowRight, Sprout, TrendingUp, Crown, Gem } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    icon: Sprout,
    theme: 'border-emerald-200 bg-emerald-50/50',
    iconBg: 'bg-emerald-100 text-emerald-600',
    risk: 'Low Risk',
    riskColor: 'bg-emerald-100 text-emerald-700',
    roi: '8% - 15%',
    roiLabel: 'Monthly ROI',
    specs: [
      { label: 'Min. Investment', value: '$50' },
      { label: 'Duration', value: 'Flexible' },
      { label: 'Capital Protection', value: 'Yes' },
    ],
    buttonClass: 'border-emerald-500 text-emerald-600 hover:bg-emerald-50',
  },
  {
    name: 'Growth',
    icon: TrendingUp,
    theme: 'border-blue-200 bg-blue-50/50',
    iconBg: 'bg-blue-100 text-[#0052ff]',
    risk: 'Medium Risk',
    riskColor: 'bg-blue-100 text-blue-700',
    roi: '15% - 25%',
    roiLabel: 'Monthly ROI',
    specs: [
      { label: 'Min. Investment', value: '$200' },
      { label: 'Duration', value: 'Flexible' },
      { label: 'Capital Protection', value: 'Yes' },
    ],
    buttonClass: 'border-[#0052ff] text-[#0052ff] hover:bg-blue-50',
  },
  {
    name: 'Prime',
    icon: Crown,
    theme: 'border-purple-300 bg-purple-50/50 ring-2 ring-purple-400',
    iconBg: 'bg-purple-100 text-purple-600',
    risk: 'Medium-High',
    riskColor: 'bg-purple-100 text-purple-700',
    roi: '25% - 40%',
    roiLabel: 'Monthly ROI',
    popular: true,
    specs: [
      { label: 'Min. Investment', value: '$500' },
      { label: 'Duration', value: 'Flexible' },
      { label: 'Capital Protection', value: 'Yes' },
    ],
    buttonClass: 'border-purple-500 text-purple-600 hover:bg-purple-50',
  },
  {
    name: 'Elite',
    icon: Gem,
    theme: 'border-orange-200 bg-orange-50/50',
    iconBg: 'bg-orange-100 text-orange-600',
    risk: 'High Risk',
    riskColor: 'bg-orange-100 text-orange-700',
    roi: '40% - 60%',
    roiLabel: 'Monthly ROI',
    specs: [
      { label: 'Min. Investment', value: '$1,000' },
      { label: 'Duration', value: 'Flexible' },
      { label: 'Capital Protection', value: 'Yes' },
    ],
    buttonClass: 'border-orange-500 text-orange-600 hover:bg-orange-50',
  },
]

export default function InvestmentPlansSection() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          {/* Left column */}
          <div className="lg:col-span-1">
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">INVESTMENT PLANS</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Plans Built For Every Investor
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Whether you&apos;re just starting out or managing a large portfolio, we have a plan
              tailored to your risk appetite and financial goals.
            </p>
            <Link
              href="/invest"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              Compare All Plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
            {plans.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-5 ${plan.theme}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-[10px] font-bold text-white">
                      Most Popular
                    </span>
                  )}
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                  <span className={`mt-1.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${plan.riskColor}`}>
                    {plan.risk}
                  </span>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">{plan.roi}</p>
                    <p className="text-xs text-gray-500">{plan.roiLabel}</p>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.specs.map((spec) => (
                      <li key={spec.label} className="flex justify-between text-xs">
                        <span className="text-gray-500">{spec.label}</span>
                        <span className="font-semibold text-gray-800">{spec.value}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-5 block rounded-lg border-2 py-2 text-center text-sm font-semibold transition-colors ${plan.buttonClass}`}
                  >
                    Choose Plan
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
