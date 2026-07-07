import { AdminRankManagementView } from '@/components/admin/AdminRankManagementView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminDisplayRanks } from '@/lib/admin/investment-queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminInvestmentRanksPage() {
  await requireAdminModule('investment_management')

  const { data: ranks, error, configured } = await withAdminData(getAdminDisplayRanks, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminRankManagementView ranks={ranks} />
    </>
  )
}
