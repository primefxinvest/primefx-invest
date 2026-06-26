import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = buildPageMetadata({
  noIndex: true,
  title: 'Admin Portal',
  description: 'PrimeFx Invest administration portal.',
  path: '/admin',
})

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return children
}
