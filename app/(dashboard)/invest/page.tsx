'use client'

import { useState } from 'react'
import { ChevronRight, Check, AlertCircle, TrendingUp } from 'lucide-react'
import { investmentPlans } from '@/lib/mock-data'

export default function InvestPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const features = [
    { icon: TrendingUp, label: 'AI-Powered Strategies', description: 'Advanced AI models analyze the market 24/7 that find the best opportunities.' },
    { icon: Check, label: 'Secure & Trusted', description: 'Bank-level security to protect your funds' },
    { icon: AlertCircle, label: 'Weekly Payouts', description: 'Profits paid out every 7 days' },
    { icon: Check, label: '24/7 Support', description: 'Our team is always here to help you' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invest</h1>
        <p className="mt-2 text-muted-foreground">Choose the perfect plan that matches your goals. AI-powered strategies for consistent growth.</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <div key={idx} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">{feature.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Investment Plans */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Investment Plans</h2>
            <p className="text-sm text-muted-foreground">4 Plans Available</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors">
              Grid View
            </button>
            <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors">
              Compare Plans
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {investmentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border-2 p-6 transition-all cursor-pointer ${
                selectedPlan === plan.id ? 'border-primary bg-blue-50 dark:bg-blue-950' : plan.popular ? 'border-primary bg-blue-50 dark:bg-blue-950' : 'border-border'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.badge && (
                <div className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </div>
              )}
              {plan.popular && (
                <div className="mb-4 inline-block rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white ml-2">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>

              <div className="mt-6">
                <div className="text-4xl font-bold text-primary">{plan.weeklyRoi}</div>
                <p className="text-sm text-muted-foreground">{plan.monthlyRoi}</p>
              </div>

              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum</span>
                  <span className="font-semibold text-foreground">{plan.minInvestment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold text-foreground">{plan.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payout</span>
                  <span className="font-semibold text-foreground">{plan.payout}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className={`font-semibold ${plan.riskLevel === 'Low' ? 'text-emerald-500' : plan.riskLevel === 'Medium' ? 'text-orange-500' : 'text-red-500'}`}>
                    {plan.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capital Access</span>
                  <span className="font-semibold text-foreground">{plan.capitalAccess}</span>
                </div>
              </div>

              <button className={`mt-6 w-full rounded-lg py-2 font-semibold transition-colors ${
                plan.popular ? 'bg-primary text-white hover:bg-blue-700' : 'border border-primary text-primary hover:bg-blue-50 dark:hover:bg-blue-950'
              }`}>
                Invest Now
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">{plan.investors} investors</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground mb-8">How It Works</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {[
            { number: '1', title: 'Create Account', description: 'Sign up and verify your identity' },
            { number: '2', title: 'Choose Your Plan', description: 'Select a plan that matches your goals' },
            { number: '3', title: 'Fund Your Account', description: 'Add funds to your wallet' },
            { number: '4', title: 'We Invest For You', description: 'Our AI handles the investing' },
            { number: '5', title: 'Grow & Withdraw', description: 'Watch your wealth grow and withdraw anytime' },
          ].map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                  {step.number}
                </div>
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              {idx < 4 && <ChevronRight className="mx-auto mt-4 h-6 w-6 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      {/* PrimeAI Recommendation */}
      <div className="rounded-lg border border-primary bg-blue-50 dark:bg-blue-950 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white font-bold text-xl flex-shrink-0">
            P
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">PrimeAI Recommendation</h2>
            <p className="mt-2 text-muted-foreground">Based on your profile, we recommend the Prime Plan. It offers a balance of growth and security.</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-foreground">25% - 40% monthly ROI</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-foreground">Medium-High risk suitable for your portfolio</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-foreground">4,789+ investors trust this plan</span>
              </div>
            </div>
            <button className="mt-4 rounded-lg bg-primary px-6 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
              Get AI Recommendation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
