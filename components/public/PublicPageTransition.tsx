'use client'

import { PageTransition } from '@/lib/motion/page-transition'

export function PublicPageTransition({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
