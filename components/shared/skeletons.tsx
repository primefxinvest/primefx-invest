import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SKELETON_CARD =
  'rounded-xl border border-gray-200/90 bg-white p-5 shadow-sm'

function staggerDelay(index: number, step = 70) {
  return index * step
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={SKELETON_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-3.5 w-[42%]" delay={staggerDelay(i)} />
              <Skeleton className="h-8 w-[68%]" delay={staggerDelay(i, 90)} />
              <Skeleton className="h-3 w-[52%]" delay={staggerDelay(i, 110)} />
            </div>
            <Skeleton
              className="h-10 w-10 shrink-0 rounded-xl"
              delay={staggerDelay(i, 80)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartCardSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={cn(SKELETON_CARD, height)}>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-24 rounded-lg" delay={80} />
      </div>
      <Skeleton className={cn('w-full rounded-lg', height === 'h-64' ? 'h-52' : 'h-40')} delay={120} />
    </div>
  )
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  showHeader = true,
}: {
  rows?: number
  cols?: number
  showHeader?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-sm">
      {showHeader ? (
        <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
          <div className="flex gap-6">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" delay={staggerDelay(i, 40)} />
            ))}
          </div>
        </div>
      ) : null}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" delay={staggerDelay(row, 50)} />
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" delay={staggerDelay(row, 60)} />
                <Skeleton className="h-3 w-24" delay={staggerDelay(row, 80)} />
              </div>
              <Skeleton className="h-4 w-16" delay={staggerDelay(row, 70)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" delay={staggerDelay(i, 55)} />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" delay={staggerDelay(i, 65)} />
              <Skeleton className="h-3 w-20" delay={staggerDelay(i, 85)} />
            </div>
          </div>
          <Skeleton className="h-4 w-14" delay={staggerDelay(i, 75)} />
        </div>
      ))}
    </div>
  )
}

export function PlanCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm sm:p-5"
        >
          <Skeleton className="h-5 w-24 rounded-full" delay={staggerDelay(i, 60)} />
          <Skeleton className="mt-4 h-24 w-full rounded-2xl" delay={staggerDelay(i, 80)} />
          <Skeleton className="mt-4 h-5 w-28" delay={staggerDelay(i, 100)} />
          <Skeleton className="mt-3 h-10 w-20" delay={staggerDelay(i, 120)} />
          <div className="mt-4 space-y-2 border-b border-gray-100 pb-4">
            {Array.from({ length: 6 }).map((__, row) => (
              <Skeleton key={row} className="h-4 w-full" delay={staggerDelay(i + row, 130)} />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((__, row) => (
              <Skeleton key={row} className="h-3.5 w-[88%]" delay={staggerDelay(i + row, 180)} />
            ))}
          </div>
          <Skeleton className="mt-5 h-11 w-full rounded-xl" delay={staggerDelay(i, 220)} />
        </div>
      ))}
    </>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton showAction />
      <div className="rounded-xl border border-gray-200/90 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" delay={80} />
            <Skeleton className="h-4 w-32" delay={100} />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-36 rounded-lg" delay={120} />
              <Skeleton className="h-8 w-28 rounded-lg" delay={140} />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-sm">
        <Skeleton className="mb-6 h-5 w-40" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" delay={staggerDelay(i, 50)} />
              <Skeleton className="h-5 w-full max-w-xs" delay={staggerDelay(i, 70)} />
            </div>
          ))}
        </div>
      </div>
      <TableSkeleton rows={4} cols={4} />
    </div>
  )
}

export function PageHeaderSkeleton({
  showAction = true,
  showDatePill = false,
}: {
  showAction?: boolean
  showDatePill?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" delay={80} />
      </div>
      {showDatePill ? (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-4 py-2.5 shadow-sm">
          <Skeleton className="h-4 w-4 rounded" delay={60} />
          <Skeleton className="h-4 w-28" delay={90} />
        </div>
      ) : showAction ? (
        <Skeleton className="h-11 w-44 rounded-xl" delay={100} />
      ) : null}
    </div>
  )
}

function PerformanceChartSkeleton() {
  const bars = [38, 52, 44, 68, 50, 72, 46, 80, 58, 74, 48, 66]

  return (
    <div className={SKELETON_CARD}>
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" delay={70} />
      </div>
      <div className="relative h-56">
        <div className="absolute inset-x-0 top-0 flex h-full flex-col justify-between pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-gray-100/80" />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-2 flex h-[calc(100%-0.5rem)] items-end gap-1.5">
          {bars.map((height, index) => (
            <Skeleton
              key={index}
              className="flex-1 rounded-t-md"
              style={{ height: `${height}%` }}
              delay={staggerDelay(index, 35)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AllocationPanelSkeleton() {
  return (
    <div className={SKELETON_CARD}>
      <Skeleton className="mb-5 h-4 w-32" />
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <Skeleton className="absolute inset-0 rounded-full" />
          <div className="relative z-10 h-[4.5rem] w-[4.5rem] rounded-full bg-white" />
        </div>
        <div className="w-full space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" delay={staggerDelay(index, 45)} />
                <Skeleton className="h-3 w-24" delay={staggerDelay(index, 55)} />
              </div>
              <Skeleton className="h-3 w-10" delay={staggerDelay(index, 65)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickActionsSkeleton() {
  return (
    <div className={SKELETON_CARD}>
      <Skeleton className="mb-4 h-4 w-28" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-4"
          >
            <Skeleton className="mb-3 h-11 w-11 rounded-xl" delay={staggerDelay(index, 50)} />
            <Skeleton className="h-3.5 w-16" delay={staggerDelay(index, 70)} />
            <Skeleton className="mt-2 h-3 w-20" delay={staggerDelay(index, 90)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" delay={staggerDelay(index, 50)} />
            <Skeleton className="h-3.5 w-24" delay={staggerDelay(index, 65)} />
          </div>
          <Skeleton className="h-5 w-28" delay={staggerDelay(index, 80)} />
          <Skeleton className="mt-2 h-3 w-20" delay={staggerDelay(index, 95)} />
          <Skeleton className="mt-3 h-2 w-full rounded-full" delay={staggerDelay(index, 110)} />
        </div>
      ))}
    </div>
  )
}

function WalletActionCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm">
          <Skeleton className="mb-3 h-10 w-10 rounded-xl" delay={staggerDelay(index, 50)} />
          <Skeleton className="h-3.5 w-16" delay={staggerDelay(index, 70)} />
          <Skeleton className="mt-2 h-3 w-20" delay={staggerDelay(index, 90)} />
        </div>
      ))}
    </div>
  )
}

function WalletPanelSkeleton() {
  return (
    <div className={cn(SKELETON_CARD, 'flex h-full min-h-[16rem] flex-col')}>
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
        <Skeleton className="h-28 w-28 rounded-full" delay={80} />
        <Skeleton className="h-4 w-36" delay={100} />
        <Skeleton className="h-3 w-48 max-w-full" delay={120} />
        <Skeleton className="h-6 w-28 rounded-full" delay={140} />
      </div>
    </div>
  )
}

export function WalletPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showAction />
      <MetricCardsSkeleton count={4} />
      <WalletActionCardsSkeleton />
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <DonutChartSkeleton />
        <WalletPanelSkeleton />
        <WalletPanelSkeleton />
      </div>
      <TableSkeleton rows={5} cols={6} />
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[1fr_380px]">
        <ChartCardSkeleton height="min-h-[18rem]" />
        <ChartCardSkeleton height="min-h-[18rem]" />
      </div>
    </div>
  )
}

export function AppPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className={SKELETON_CARD}>
        <div className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-2xl" delay={70} />
          <Skeleton className="h-4 w-full max-w-xl" delay={100} />
          <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
            <Skeleton className="h-36 rounded-xl" delay={120} />
            <Skeleton className="h-36 rounded-xl" delay={140} />
          </div>
        </div>
      </div>
      <TableSkeleton rows={4} cols={4} />
    </div>
  )
}

export function NotificationListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showAction={false} />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" delay={staggerDelay(i, 50)} />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" delay={staggerDelay(i, 65)} />
                <Skeleton className="h-3 w-full max-w-md" delay={staggerDelay(i, 80)} />
                <Skeleton className="h-3 w-16" delay={staggerDelay(i, 95)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DonutChartSkeleton() {
  return (
    <div className={cn(SKELETON_CARD, 'h-full')}>
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <Skeleton className="absolute inset-0 rounded-full" />
          <div className="relative z-10 h-24 w-24 rounded-full bg-white" />
        </div>
        <div className="w-full space-y-3 sm:flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" delay={staggerDelay(i, 55)} />
              <Skeleton className="h-3 w-10" delay={staggerDelay(i, 70)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showDatePill />
      <MetricCardsSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceChartSkeleton />
        </div>
        <AllocationPanelSkeleton />
      </div>
      <QuickActionsSkeleton />
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <PlanCardsSkeleton count={3} />
          <TableSkeleton rows={4} cols={4} />
        </div>
        <ChartCardSkeleton height="h-48" />
      </div>
      <StatusCardsSkeleton />
    </div>
  )
}

function resolveSessionSkeleton(pathname: string) {
  if (pathname === '/dashboard') return <DashboardPageSkeleton />
  if (pathname === '/wallet') return <WalletPageSkeleton />
  if (pathname === '/profile') return <ProfileSkeleton />
  if (pathname === '/notifications') return <NotificationListSkeleton />
  if (pathname.startsWith('/portfolio')) return <AppPageSkeleton />
  return <AppPageSkeleton />
}

export function AppSessionSkeleton({ pathname }: { pathname: string }) {
  return (
    <div
      className="animate-in fade-in duration-500"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {resolveSessionSkeleton(pathname)}
    </div>
  )
}
