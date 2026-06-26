import AppLayout from '@/components/shared/AppLayout'
import { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
