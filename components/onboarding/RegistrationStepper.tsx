'use client'

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'

const SIGNUP_STEPS = [
  { title: 'Create Account' },
  { title: 'Verify Email' },
  { title: 'Profile Setup' },
  { title: 'Get Started' },
] as const

interface RegistrationStepperProps {
  activeStep?: number
  className?: string
}

export function RegistrationStepper({ activeStep = 1, className }: RegistrationStepperProps) {
  return (
    <Stepper value={activeStep} className={className}>
      <StepperNav className="mb-2 gap-3.5">
        {SIGNUP_STEPS.map((step, index) => (
          <StepperItem key={step.title} step={index + 1} className="relative flex-1 items-start">
            <StepperTrigger
              className="flex w-full flex-col items-start justify-center gap-2.5"
              tabIndex={-1}
              disabled
            >
              <StepperIndicator className="h-1 w-full rounded-full bg-border data-[state=active]:bg-primary data-[state=completed]:bg-primary" />
              <StepperTitle className="text-start text-xs font-semibold group-data-[state=inactive]/step:text-muted-foreground sm:text-sm">
                {step.title}
              </StepperTitle>
            </StepperTrigger>
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  )
}
