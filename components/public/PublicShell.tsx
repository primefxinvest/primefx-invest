import LandingFooter from '@/components/landing/LandingFooter'
import LandingNav from '@/components/landing/LandingNav'
import { TrustIndicatorsBar } from '@/components/public/TrustIndicatorsBar'
import { PublicPageTransition } from '@/components/public/PublicPageTransition'
import { MotionProvider } from '@/lib/motion/MotionProvider'
import { ReactNode } from 'react'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <LandingNav />
      <TrustIndicatorsBar />
      <MotionProvider>
        <main className="min-w-0 overflow-x-hidden pt-16">
          <PublicPageTransition>{children}</PublicPageTransition>
        </main>
      </MotionProvider>
      <LandingFooter />
    </div>
  )
}
