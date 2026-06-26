import { PublicShell } from '@/components/public/PublicShell'
import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>
}
