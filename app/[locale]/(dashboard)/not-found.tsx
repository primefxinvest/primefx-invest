import { NotFoundView } from '@/components/shared/NotFoundView'

export default function DashboardNotFound() {
  return (
    <NotFoundView
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
      description="This page doesn't exist in your investor dashboard. Check the URL or return to the dashboard."
    />
  )
}
