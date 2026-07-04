import type { Metadata } from 'next'
import { ReactNode, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AuthLayoutNav } from '@/components/auth/AuthLayoutNav'
import AuthRedirectGuard from '@/components/auth/AuthRedirectGuard'
import { buildPageMetadata } from '@/lib/seo/metadata'

function AuthLoadingCard() {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-border bg-card p-8 shadow-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')

  return buildPageMetadata({
    noIndex: true,
    title: t('layoutTitle'),
    description: t('layoutDescription'),
    path: '/login',
  })
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <AuthLayoutNav />
      <main className="flex flex-1 flex-col pt-14 lg:pt-0">
        <Suspense fallback={<AuthLoadingCard />}>
          <AuthRedirectGuard>{children}</AuthRedirectGuard>
        </Suspense>
      </main>
    </div>
  )
}
