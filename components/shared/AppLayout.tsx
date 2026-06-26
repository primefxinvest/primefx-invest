'use client'

import { ReactNode } from 'react'
import MfaSessionGuard from '@/components/auth/MfaSessionGuard'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <MfaSessionGuard>
      <div className="min-h-screen bg-[#f5f7fa]">
        <Sidebar />
        <Navbar />
        <main className="fixed bottom-0 left-64 right-0 top-[57px] overflow-y-auto">
          <div className="mx-auto max-w-8xl px-6 py-6">{children}</div>
        </main>
      </div>
    </MfaSessionGuard>
  )
}
