import LandingFooter from '@/components/landing/LandingFooter'
import LandingNav from '@/components/landing/LandingNav'
import { ReactNode } from 'react'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <main className="pt-16">{children}</main>
      <LandingFooter />
    </div>
  )
}
