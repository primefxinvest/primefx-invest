import { AdminKycView } from '@/components/admin/AdminKycView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminKycQueue } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminKycPage() {
  await requireAdminModule('kyc_aml_compliance')
  const { data, error, configured } = await withAdminData(getAdminKycQueue, [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminKycView queue={data} />
    </>
  )
}
