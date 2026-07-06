'use client'

import { cn } from '@/lib/utils'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import { resolveReferralInitials } from '@/lib/referral/member-profile'

type ReferralMemberAvatarProps = {
  name: string
  avatarUrl?: string | null
  seed?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
} as const

export function ReferralMemberAvatar({
  name,
  avatarUrl,
  seed,
  size = 'md',
  className,
}: ReferralMemberAvatarProps) {
  const initials = resolveReferralInitials(name)
  const photoUrl = avatarUrl?.trim()
  const src = photoUrl || getDefaultAvatarUrl(seed || name)

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-muted',
        SIZE_CLASSES[size],
        className
      )}
    >
      {photoUrl || seed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-bold text-foreground">
          {initials || '?'}
        </div>
      )}
    </div>
  )
}
