import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { AdminVerificationsView } from '@/components/admin/AdminVerificationsView'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminVerificationSessions } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'
import type { AdminVerificationSessionsResult } from '@/lib/admin/types'

const EMPTY_RESULT: AdminVerificationSessionsResult = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 20,
  stats: {
    total: 0,
    approved: 0,
    declined: 0,
    inReview: 0,
    pending: 0,
  },
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}) {
  // Access control: admin portal layout + kyc_aml_compliance module gate
  await requireAdminModule('kyc_aml_compliance')

  const params = await searchParams
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)
  const status = params.status?.trim() || 'all'
  const search = params.q?.trim() || ''

  const { data, error, configured } = await withAdminData(
    () =>
      getAdminVerificationSessions({
        page,
        pageSize: 20,
        status,
        search,
      }),
    EMPTY_RESULT
  )

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminVerificationsView
        initialData={data}
        initialStatus={status}
        initialSearch={search}
        initialPage={page}
      />
    </>
  )
}
