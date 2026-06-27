'use client'

import { Steps as ArkSteps } from '@ark-ui/react/steps'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Steps = ArkSteps

export const stepIndicatorClassName =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold data-complete:border-[#0052ff] data-complete:bg-[#0052ff] data-complete:text-white data-current:border-[#0052ff] data-current:bg-[#0052ff] data-current:text-white data-incomplete:border-gray-200 data-incomplete:bg-gray-100 data-incomplete:text-gray-500'

export interface StepItem {
  title: string
  description: string
}

interface StepsHorizontalProps {
  steps: number[]
  className?: string
  defaultStep?: number
}

export function StepsHorizontal({
  steps,
  className,
  defaultStep = 1,
}: StepsHorizontalProps) {
  return (
    <Steps.Root count={steps.length} defaultStep={defaultStep} className={cn('w-full', className)}>
      <Steps.List className="flex items-center justify-between">
        {steps.map((step, index) => (
          <Steps.Item
            key={step}
            index={index}
            className="relative flex items-center not-last:flex-1"
          >
            <Steps.Trigger className="flex items-center gap-3 rounded-md text-left">
              <Steps.Indicator className={stepIndicatorClassName}>{step}</Steps.Indicator>
            </Steps.Trigger>
            <Steps.Separator
              hidden={index === steps.length - 1}
              className="mx-3 h-0.5 flex-1 bg-gray-200 data-complete:bg-[#0052ff]"
            />
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  )
}

interface StepsVerticalTitlesProps {
  steps: StepItem[]
  className?: string
  defaultStep?: number
}

export function StepsVerticalTitles({
  steps,
  className,
  defaultStep = 1,
}: StepsVerticalTitlesProps) {
  return (
    <Steps.Root
      count={steps.length}
      defaultStep={defaultStep}
      orientation="vertical"
      className={cn('w-full', className)}
    >
      <Steps.List className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <Steps.Item key={step.title} index={index} className="relative flex items-start">
            <Steps.Trigger className="group flex items-start gap-3 rounded-md text-left">
              <Steps.Indicator className={cn(stepIndicatorClassName, 'relative')}>
                <span className="group-data-complete:hidden group-data-current:block">
                  {index + 1}
                </span>
                <Check className="hidden h-4 w-4 group-data-complete:block" />
              </Steps.Indicator>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                <span className="text-xs text-gray-500">{step.description}</span>
              </div>
            </Steps.Trigger>
            <Steps.Separator
              hidden={index === steps.length - 1}
              className="absolute top-8 left-4 h-8 w-0.5 bg-gray-200 data-complete:bg-[#0052ff]"
            />
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  )
}

interface HowItWorksStepsProps {
  steps: readonly { number: string; title: string; description: string }[]
  className?: string
}

/** Compact steps for the invest "How it works" section. */
export function HowItWorksSteps({ steps, className }: HowItWorksStepsProps) {
  return (
    <Steps.Root
      count={steps.length}
      defaultStep={steps.length - 1}
      linear={false}
      className={cn('w-full', className)}
    >
      <Steps.List className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:gap-3">
        {steps.map((step, index) => (
          <Steps.Item
            key={step.number}
            index={index}
            className="flex flex-col items-center text-center lg:min-w-0"
          >
            <Steps.Trigger className="flex w-full flex-col items-center gap-1.5 rounded-md px-1 py-1 text-center">
              <Steps.Indicator className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0052ff] text-xs font-bold text-white">
                {step.number}
              </Steps.Indicator>
              <span className="text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
                {step.title}
              </span>
              <span className="text-[11px] leading-snug text-gray-500 sm:text-xs">
                {step.description}
              </span>
            </Steps.Trigger>
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  )
}
