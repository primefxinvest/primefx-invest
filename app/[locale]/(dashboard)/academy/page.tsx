'use client'

import { AcademyPageView } from '@/components/academy/AcademyPageView'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchAcademyCourses, fetchAcademyStats } from '@/lib/data/queries'

export default function AcademyPage() {
  const { data: courses = [], loading, error, reload } = useAsyncData(
    () => fetchAcademyCourses(),
    []
  )
  const { data: stats } = useAsyncData(() => fetchAcademyStats(), [])

  return (
    <AcademyPageView
      courses={courses}
      stats={stats ?? null}
      loading={loading}
      error={error}
      onRetry={reload}
    />
  )
}
