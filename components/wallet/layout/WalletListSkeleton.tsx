export function WalletListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}
