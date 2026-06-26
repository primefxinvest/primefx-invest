'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main className="fixed right-0 top-16 left-64 bottom-0 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
