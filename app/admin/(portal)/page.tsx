import { AdminDashboardView } from '@/components/admin/AdminDashboardView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminDashboardMetrics } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'
import type { AdminDashboardMetrics } from '@/lib/admin/types'

const EMPTY_METRICS: AdminDashboardMetrics = {
  totalUsers: 0,
  activeInvestors: 0,
  totalAum: 0,
  pendingKyc: 0,
  pendingWithdrawals: 0,
  pendingDeposits: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  netFlow: 0,
  monthlyVolume: [],
  tierDistribution: {},
  transactionBreakdown: { pending: 0, completed: 0, failed: 0 },
  recentTransactions: [],
  recentAuditLogs: [],
}

export default async function AdminDashboardPage() {
  await requireAdminModule('analytics_reporting')
  const { data, error, configured } = await withAdminData(
    getAdminDashboardMetrics,
    EMPTY_METRICS
  )

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminDashboardView metrics={data} />
    </>
  )
}
