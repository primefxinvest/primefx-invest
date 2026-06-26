import { AdminPlansView } from '@/components/admin/AdminPlansView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminPlans } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminPlansPage() {
  await requireAdminModule('investment_plan_management')
  const { data, error, configured } = await withAdminData(getAdminPlans, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminPlansView plans={data} />
    </>
  )
}
