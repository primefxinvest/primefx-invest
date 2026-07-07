import { memo } from 'react'

export default memo(function HeroDashboardSceneSkeleton() {
  return (
    <div
      className="relative mx-auto h-[280px] w-full max-w-[580px] animate-pulse md:h-[560px] lg:mx-0 lg:max-w-none"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-[1.5rem] bg-blue-50/30 md:rounded-[2rem]" />
      <div className="absolute left-1/2 top-6 w-full max-w-[300px] -translate-x-1/2 rounded-[1.25rem] border border-white/40 bg-white/30 md:top-1/2 md:max-w-[480px] md:-translate-y-[45%]" />
    </div>
  )
})
