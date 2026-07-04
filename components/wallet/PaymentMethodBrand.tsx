'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PaymentMethodBrandProps = {
  src: string
  alt: string
  fallbackIcon: LucideIcon
  className?: string
  imageClassName?: string
}

export function PaymentMethodBrand({
  src,
  alt,
  fallbackIcon: FallbackIcon,
  className,
  imageClassName,
}: PaymentMethodBrandProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={cn(
        'flex h-10 w-[7.25rem] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white px-2 py-1 shadow-sm ring-1 ring-gray-100',
        className
      )}
    >
      {failed ? (
        <FallbackIcon className="h-5 w-5 text-[#0052ff]" aria-hidden />
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn('h-full w-full object-contain', imageClassName)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
