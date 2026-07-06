import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminSupportMessagesView } from '@/components/admin/AdminSupportMessagesView'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminAssistanceSessions } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'
import { checkAssistanceInfrastructure } from '@/lib/assistance/infrastructure'

export default async function AdminSupportMessagesPage() {
  await requireAdminModule('support_tickets')
  const infra = await checkAssistanceInfrastructure()
  const { data, error, configured } = await withAdminData(getAdminAssistanceSessions, [])

  const infrastructureWarning =
    !infra.ready
      ? infra.message
      : error?.includes('schema cache') || error?.includes('does not exist')
        ? 'Support tables are missing. Apply migrations 035 and 036 in Supabase.'
        : null

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error && !infrastructureWarning ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminSupportMessagesView sessions={data} infrastructureWarning={infrastructureWarning} />
    </>
  )
}
