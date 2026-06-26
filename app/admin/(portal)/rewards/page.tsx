import { AdminRewardsView } from '@/components/admin/AdminRewardsView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminRewardsTiers } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminRewardsPage() {
  await requireAdminModule('rewards_referral')
  const { data, error, configured } = await withAdminData(getAdminRewardsTiers, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminRewardsView tiers={data as never[]} />
    </>
  )
}
