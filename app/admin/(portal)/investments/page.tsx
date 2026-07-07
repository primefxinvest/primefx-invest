import { AdminInvestmentsView } from '@/components/admin/AdminInvestmentsView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import {
  getAdminDisplayRanks,
  getAdminInvestmentActivity,
  getAdminInvestmentAnalytics,
  getAdminInvestments,
  getAdminInvestmentStats,
} from '@/lib/admin/investment-queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminInvestmentsPage() {
  await requireAdminModule('investment_management')

  const { data: investments, error, configured } = await withAdminData(getAdminInvestments, [])

  const stats = investments.length ? await getAdminInvestmentStats(investments) : {
    totalActive: 0,
    totalInvestedCapital: 0,
    totalOutstandingProfit: 0,
    todayProfit: 0,
    weeklyProfit: 0,
    monthlyProfit: 0,
    averageRoi: 0,
    highestInvestor: null,
    newestInvestor: null,
  }

  const analytics = investments.length
    ? await getAdminInvestmentAnalytics(investments)
    : {
        investmentGrowth: [],
        planDistribution: [],
        profitDistribution: [],
        countryDistribution: [],
        rankDistribution: [],
        dailyInvestments: [],
      }

  const [ranks, activity] = configured && !error
    ? await Promise.all([getAdminDisplayRanks(), getAdminInvestmentActivity()])
    : [[], []]

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminInvestmentsView
        investments={investments}
        stats={stats}
        analytics={analytics}
        activity={activity}
        ranks={ranks}
      />
    </>
  )
}
