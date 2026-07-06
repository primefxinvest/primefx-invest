import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminSupportHub } from '@/components/admin/AdminSupportHub'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminAssistanceSessions, getAdminSupportTickets } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'
import { checkAssistanceInfrastructure } from '@/lib/assistance/infrastructure'

export default async function AdminSupportPage() {
  await requireAdminModule('support_tickets')
  const infra = await checkAssistanceInfrastructure()

  const [ticketsResult, sessionsResult] = await Promise.all([
    withAdminData(getAdminSupportTickets, []),
    withAdminData(getAdminAssistanceSessions, []),
  ])

  const configured = ticketsResult.configured && sessionsResult.configured
  const error = ticketsResult.error ?? sessionsResult.error
  const infrastructureWarning = !infra.ready ? infra.message : null

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {infrastructureWarning ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {infrastructureWarning}
        </div>
      ) : null}
      {error && !infrastructureWarning ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminSupportHub tickets={ticketsResult.data} sessions={sessionsResult.data} />
    </>
  )
}
