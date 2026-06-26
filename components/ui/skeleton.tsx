import { cn } from '@/lib/utils'

type SkeletonProps = React.ComponentProps<'div'> & {
  delay?: number
}

function Skeleton({ className, delay, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-100/95',
        'after:pointer-events-none after:absolute after:inset-0 after:animate-skeleton-shimmer after:[animation-delay:var(--skeleton-delay,0ms)] after:bg-gradient-to-r after:from-transparent after:via-white/65 after:to-transparent',
        className
      )}
      style={
        delay !== undefined
          ? { ...style, ['--skeleton-delay' as string]: `${delay}ms` }
          : style
      }
      {...props}
    />
  )
}

export { Skeleton }
