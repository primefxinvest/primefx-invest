'use client'

import { BadgeCheck } from 'lucide-react'
import { ReferralMemberAvatar } from '@/components/referral/shared/ReferralMemberAvatar'
import { cn } from '@/lib/utils'

type ReferralMemberIdentityProps = {
  name: string
  username?: string | null
  country?: string | null
  verified?: boolean
  avatarUrl?: string | null
  seed?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ReferralMemberIdentity({
  name,
  username,
  country,
  verified = false,
  avatarUrl,
  seed,
  subtitle,
  size = 'md',
  className,
}: ReferralMemberIdentityProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <ReferralMemberAvatar name={name} avatarUrl={avatarUrl} seed={seed} size={size} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate font-semibold text-foreground">{name}</p>
          {verified ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified investor" />
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[username ? `@${username}` : null, country, subtitle].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}
