import { AdminWalletsView } from '@/components/admin/AdminWalletsView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminWallets } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminWalletsPage() {
  await requireAdminModule('financial_management')
  const { data, error, configured } = await withAdminData(getAdminWallets, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminWalletsView wallets={data} />
    </>
  )
}
