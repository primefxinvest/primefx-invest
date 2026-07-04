import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminSupportView } from '@/components/admin/AdminSupportView'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminSupportTickets } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminSupportPage() {
  await requireAdminModule('support_tickets')
  const { data, error, configured } = await withAdminData(getAdminSupportTickets, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminSupportView tickets={data} />
    </>
  )
}
