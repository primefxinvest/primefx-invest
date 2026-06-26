'use client'

import { ReactNode } from 'react'
import MfaSessionGuard from '@/components/auth/MfaSessionGuard'
import { MobileNavProvider } from '@/components/shared/MobileNavContext'
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
        <main className="primefx-scrollbar fixed bottom-0 left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] overflow-y-auto lg:left-64">
          <div className="mx-auto max-w-8xl px-4 py-4 sm:px-6 sm:py-6">
            <MfaSessionGuard>{children}</MfaSessionGuard>
          </div>
        </main>
      </div>
    </MobileNavProvider>
  )
}
