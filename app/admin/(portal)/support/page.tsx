import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminSupportHub } from '@/components/admin/AdminSupportHub'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminAssistanceSessions, getAdminSupportTickets } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminSupportPage() {
  await requireAdminModule('support_tickets')

  const [ticketsResult, sessionsResult] = await Promise.all([
    withAdminData(getAdminSupportTickets, []),
    withAdminData(getAdminAssistanceSessions, []),
  ])

  const configured = ticketsResult.configured && sessionsResult.configured
  const error = ticketsResult.error ?? sessionsResult.error

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminSupportHub tickets={ticketsResult.data} sessions={sessionsResult.data} />
    </>
  )
}
