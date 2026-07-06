'use client'

import { useState } from 'react'
import { JOURNEY_STEPS } from '@/lib/how-primefx-works/content'
import { MotionCard } from '@/lib/motion/motion-card'
import { StaggerContainer, StaggerItem } from '@/lib/motion/stagger'
import { cn } from '@/lib/utils'
import { SectionHeader, SectionShell } from './shared'

export function HowPrimefxJourneySection() {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <SectionShell id="investment-journey" variant="muted">
      <SectionHeader
        eyebrow="Process"
        title="The Complete Investment Journey"
        subtitle="Start, invest, earn, and grow in 8 clear steps — from account creation to reinvestment."
      />

      <div className="mb-6 hidden lg:block">
        <div className="flex items-center justify-between gap-1">
          {JOURNEY_STEPS.map((step) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(step.number)}
              aria-label={`Step ${step.number}: ${step.title}`}
              aria-current={activeStep === step.number ? 'step' : undefined}
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                activeStep === step.number
                  ? 'bg-[#0052ff] text-white shadow-md shadow-blue-500/25'
                  : step.number < activeStep
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-200 text-gray-500'
              )}
            >
              {step.number}
            </button>
          ))}
        </div>
        <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#0052ff] transition-[width] duration-300 ease-out"
            style={{ width: `${((activeStep - 1) / (JOURNEY_STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNEY_STEPS.map((step) => {
          const Icon = step.icon
          const isActive = activeStep === step.number
          return (
            <StaggerItem key={step.number}>
              <MotionCard
                className={cn(
                  'flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition-colors sm:p-6',
                  isActive
                    ? 'border-[#0052ff]/40 ring-2 ring-[#0052ff]/15'
                    : 'border-gray-200'
                )}
              >
                <button
                  type="button"
                  className="text-left"
                  onMouseEnter={() => setActiveStep(step.number)}
                  onFocus={() => setActiveStep(step.number)}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="relative flex size-12 items-center justify-center rounded-xl border-2 border-[#0052ff]/20 bg-blue-50">
                      <Icon className="size-5 text-[#0052ff]" aria-hidden />
                      <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-[#0052ff] text-[10px] font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 sm:text-base">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                    {step.description}
                  </p>
                </button>
              </MotionCard>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </SectionShell>
  )
}
