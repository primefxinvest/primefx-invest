'use client'

import { ReactNode } from 'react'
import MfaSessionGuard from '@/components/auth/MfaSessionGuard'
import { NotificationPushListener } from '@/components/notifications/NotificationPushListener'
import MobileBottomNav from '@/components/shared/MobileBottomNav'
import { MobileNavProvider } from '@/components/shared/MobileNavContext'
import { SkipLink } from '@/components/shared/SkipLink'
import { SIDEBAR_OFFSET_CLASS, SIDEBAR_OFFSET_TABLET_CLASS } from '@/lib/layout/sidebar'
import { mobileNavBottomPadClass, pagePaddingClass } from '@/lib/layout/spacing'
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
            SIDEBAR_OFFSET_TABLET_CLASS,
            SIDEBAR_OFFSET_CLASS,
            mobileNavBottomPadClass
          )}
        >
          <NotificationPushListener />
          <div className={pagePaddingClass}>
            <MfaSessionGuard>{children}</MfaSessionGuard>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </MobileNavProvider>
  )
}
