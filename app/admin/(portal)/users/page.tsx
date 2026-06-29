import { AdminUsersView } from '@/components/admin/AdminUsersView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { getAdminUserMfaSummary } from '@/lib/auth/mfa-admin'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminUsers } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminUsersPage() {
  const adminContext = await requireAdminModule('user_management')
  const { data, error, configured } = await withAdminData(getAdminUsers, [])

  const mfaSummary =
    configured && !error && data.length > 0
      ? await getAdminUserMfaSummary(data.map((user) => user.id))
      : {}

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminUsersView
        users={data}
        mfaSummary={mfaSummary}
        dataReady={configured && !error}
        currentAdminUserId={adminContext.userId}
      />
    </>
  )
}
