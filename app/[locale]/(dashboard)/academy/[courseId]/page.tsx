'use client'

import { useParams } from 'next/navigation'
import { AcademyCourseDetailView } from '@/components/academy/AcademyCourseDetailView'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchAcademyCourseDetail } from '@/lib/data/queries'

export default function AcademyCoursePage() {
  const params = useParams()
  const courseId = params.courseId as string

  const { data: course = null, loading, error, reload } = useAsyncData(
    () => fetchAcademyCourseDetail(courseId),
    [courseId]
  )

  return (
    <AcademyCourseDetailView
      course={course}
      courseId={courseId}
      loading={loading}
      error={error}
      onRetry={reload}
    />
  )
}
