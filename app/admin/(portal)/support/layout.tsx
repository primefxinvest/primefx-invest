import { AdminSupportNav } from '@/components/admin/AdminSupportNav'

export default function AdminSupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminSupportNav />
      {children}
    </div>
  )
}
