import { AdminSettingsView } from '@/components/admin/AdminSettingsView'
import { requireAdminModule } from '@/lib/admin/auth'
import { getPlatformSettingsSnapshot } from '@/lib/admin/platform-settings'

export default async function AdminSettingsPage() {
  await requireAdminModule('platform_configuration')
  const settings = await getPlatformSettingsSnapshot()

  return <AdminSettingsView settings={settings} />
}
