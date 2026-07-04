'use client'

import { ReactNode } from 'react'
import MfaSessionGuard from '@/components/auth/MfaSessionGuard'
import { NotificationPushListener } from '@/components/notifications/NotificationPushListener'
import { MobileNavProvider } from '@/components/shared/MobileNavContext'
import { SkipLink } from '@/components/shared/SkipLink'
import { SIDEBAR_OFFSET_CLASS } from '@/lib/layout/sidebar'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <MobileNavProvider>
      <SkipLink />
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'primefx-scrollbar fixed bottom-0 left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] overflow-x-hidden overflow-y-auto outline-none',
            SIDEBAR_OFFSET_CLASS
          )}
        >
          <NotificationPushListener />
          <div className="px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-5">
            <MfaSessionGuard>{children}</MfaSessionGuard>
          </div>
        </main>
      </div>
    </MobileNavProvider>
  )
}
