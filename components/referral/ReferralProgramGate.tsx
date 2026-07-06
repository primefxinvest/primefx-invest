'use client'

import type { ReactNode } from 'react'

interface ReferralProgramGateProps {
  children: React.ReactNode
}

/** Referral access is universal — this gate is a compatibility pass-through. */
export function ReferralProgramGate({ children }: ReferralProgramGateProps) {
  return children
}
