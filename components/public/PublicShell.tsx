import LandingFooter from '@/components/landing/LandingFooter'
import LandingNav from '@/components/landing/LandingNav'
import { ReactNode } from 'react'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <LandingNav />
      <main className="min-w-0 overflow-x-hidden pt-16">{children}</main>
      <LandingFooter />
    </div>
  )
}
