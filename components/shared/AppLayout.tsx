'use client'

import { ReactNode } from 'react'
import MfaSessionGuard from '@/components/auth/MfaSessionGuard'
import { NotificationPushListener } from '@/components/notifications/NotificationPushListener'
import { MobileNavProvider } from '@/components/shared/MobileNavContext'
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
      <div className="min-h-screen bg-[#f5f7fa]">
        <Sidebar />
        <Navbar />
        <main
          className={cn(
            'primefx-scrollbar fixed bottom-0 left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] overflow-y-auto',
            SIDEBAR_OFFSET_CLASS
          )}
        >
          <NotificationPushListener />
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <MfaSessionGuard>{children}</MfaSessionGuard>
          </div>
        </main>
      </div>
    </MobileNavProvider>
  )
}
