import { AdminUsersView } from '@/components/admin/AdminUsersView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminUsers } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminUsersPage() {
  await requireAdminModule('user_management')
  const { data, error, configured } = await withAdminData(getAdminUsers, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminUsersView users={data} />
    </>
  )
}
