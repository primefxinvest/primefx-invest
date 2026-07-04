import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AuthSplitShellProps = {
  hero: ReactNode
  children: ReactNode
  className?: string
}

export function AuthSplitShell({ hero, children, className }: AuthSplitShellProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full min-h-[calc(100dvh-3.5rem)] max-w-[1440px] flex-col lg:min-h-[calc(100dvh-0px)] lg:flex-row lg:items-stretch',
        className
      )}
    >
      {hero}
      <div className="flex flex-1 flex-col bg-background lg:min-h-screen lg:justify-center lg:px-6 lg:py-10 xl:px-10">
        <div className="flex flex-1 flex-col justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:max-w-[480px] lg:flex-none lg:px-0 lg:py-0 xl:max-w-[520px] xl:mx-auto xl:w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
