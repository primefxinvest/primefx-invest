import { cn } from '@/lib/utils'

export function WalletStepIndicator({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-0">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const active = stepNumber === current
        const completed = stepNumber < current

        return (
          <div key={step} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  active || completed
                    ? 'bg-[#0052ff] text-white'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {stepNumber}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm font-medium sm:block',
                  active ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  'mx-2 hidden h-0.5 flex-1 sm:block',
                  completed ? 'bg-[#0052ff]' : 'bg-gray-200'
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
