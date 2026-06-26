import { ReactNode } from 'react'
import { AuthLayoutNav } from '@/components/auth/AuthLayoutNav'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-background to-secondary">
      <AuthLayoutNav />
      <main className="flex flex-1 items-center justify-center p-4 pt-20 sm:pt-24">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
