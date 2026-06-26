import { ReactNode, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthLayoutNav } from '@/components/auth/AuthLayoutNav'
import AuthRedirectGuard from '@/components/auth/AuthRedirectGuard'

function AuthLoadingCard() {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 shadow-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-background to-secondary">
      <AuthLayoutNav />
      <main className="flex flex-1 items-center justify-center p-4 pt-20 sm:pt-24">
        <div className="w-full max-w-md">
          <Suspense fallback={<AuthLoadingCard />}>
            <AuthRedirectGuard>{children}</AuthRedirectGuard>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
