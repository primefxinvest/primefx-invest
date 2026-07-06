'use client'

import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { ArrowRight } from 'lucide-react'
import { InfoCard, SectionHeader, SectionShell } from './shared'

const PROFIT_POINTS = [
  'Profits are distributed every week to your wallet.',
  'You may withdraw profits at any time, subject to platform terms.',
  'You may reinvest profits into new or existing plans.',
  'Principal remains invested until you initiate a withdrawal.',
] as const

const CHART_POINTS = [20, 28, 24, 35, 32, 40, 38, 45, 42, 50, 48, 55]

function ProfitChart() {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const line = CHART_POINTS.map((y, i) => `${(i / (CHART_POINTS.length - 1)) * 100},${100 - y}`).join(' ')

  if (reduced || !mounted) {
    return (
      <svg viewBox="0 0 100 50" className="mt-4 h-16 w-full" aria-hidden>
        <polyline fill="none" stroke="#0052ff" strokeWidth="2" points={line} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 50" className="mt-4 h-16 w-full" aria-hidden>
      <m.polyline
        fill="none"
        stroke="#0052ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
      />
    </svg>
  )
}

export function HowPrimefxProfitsSection() {
  return (
    <SectionShell id="how-profits-work" variant="muted">
      <SectionHeader
        eyebrow="Returns"
        title="How Profits Work"
        subtitle="A transparent weekly profit model — understand exactly how your returns are calculated and distributed."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
              <TrendingUp className="size-5 text-[#0052ff]" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Weekly Profit Example</h3>
          </div>

          <div className="space-y-3 rounded-xl bg-gray-50 p-4">
            {[
              { label: 'Investment', value: '$1,000', highlight: false },
              { label: 'Plan', value: 'Growth Plan', highlight: false },
              { label: 'Weekly Return', value: '3.5%', highlight: true },
              { label: 'Weekly Profit', value: '$35.00', highlight: true },
              { label: 'Distribution', value: 'Every week', highlight: false },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span
                  className={
                    row.highlight ? 'font-bold text-[#0052ff]' : 'font-semibold text-gray-900'
                  }
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <ProfitChart />

          <p className="mt-4 text-xs text-gray-500">
            Illustration only. Actual returns depend on your plan, principal, and program terms.
          </p>
        </InfoCard>

        <InfoCard>
          <h3 className="text-lg font-bold text-gray-900">Profit Distribution</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            When your investment is active, the platform calculates your weekly profit based on
            your plan&apos;s target return rate and invested principal. Profits are credited to your
            wallet on the scheduled distribution cycle.
          </p>

          <ul className="mt-5 space-y-3">
            {PROFIT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-gray-600">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
