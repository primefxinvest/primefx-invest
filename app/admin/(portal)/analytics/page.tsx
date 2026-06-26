import { AdminAnalyticsView } from '@/components/admin/AdminAnalyticsView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminAnalytics } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

const EMPTY_ANALYTICS = {
  totalUsers: 0,
  totalInvestments: 0,
  planDistribution: [],
  tierDistribution: {},
  countryDistribution: {},
  completedDeposits: 0,
  completedWithdrawals: 0,
  netRevenue: 0,
}

export default async function AdminAnalyticsPage() {
  await requireAdminModule('analytics_reporting')
  const { data, error, configured } = await withAdminData(getAdminAnalytics, EMPTY_ANALYTICS)

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminAnalyticsView data={data} />
    </>
  )
}
