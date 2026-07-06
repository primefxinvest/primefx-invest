'use client'

import { Shield, ShieldCheck, Fingerprint, Lock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const TRUST_ITEMS = [
  { icon: Lock, label: 'Encryption' },
  { icon: ShieldCheck, label: 'Identity Verification' },
  { icon: Shield, label: 'Secure Withdrawals' },
  { icon: Eye, label: 'Fraud Monitoring' },
  { icon: Fingerprint, label: 'MFA Support' },
] as const

export function TrustIndicatorsBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'border-b border-gray-100 bg-gray-50/80 py-2',
        className
      )}
      role="complementary"
      aria-label="Security and trust indicators"
    >
      <div className="mx-auto flex max-w-8xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 sm:px-6 lg:px-8">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 sm:text-xs"
          >
            <Icon className="size-3.5 text-emerald-500" aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
