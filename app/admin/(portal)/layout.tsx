import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminServiceRoleGate } from '@/components/admin/AdminServiceRoleGate'

export default async function AdminPortalLayout({ children }: { children: ReactNode }) {
  const context = await getAdminContext()
  if (!context) {
    redirect('/admin/unauthorized')
  }

  return (
    <AdminShell context={context}>
      <AdminServiceRoleGate />
      {children}
    </AdminShell>
  )
}
