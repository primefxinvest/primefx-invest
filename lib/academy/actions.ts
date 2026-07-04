'use server'

import { revalidatePath } from 'next/cache'
import { courseAccessDeniedReason } from '@/lib/academy/access'
import {
  getAcademyCourseById,
  getAcademyLessonsByCourseId,
  getUserCourseEnrollment,
} from '@/lib/db/supabase'
import { canAccessFeature, normalizeInvestorTier } from '@/lib/investor/tiers'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.id) {
    return { supabase, user: null, tier: 'starter', error: 'Not authenticated' as const }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('investor_tier')
    .eq('id', user.id)
    .maybeSingle()

  const tier =
    (profile?.investor_tier as string | undefined) ??
    (user.user_metadata?.investor_tier as string | undefined) ??
    'starter'

  return { supabase, user, tier, error: null }
}

function revalidateAcademyPaths(courseId: string) {
  revalidatePath('/academy')
  revalidatePath(`/academy/${courseId}`)
}

export async function enrollInCourse(
  courseId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await getAuthenticatedUser()
  if (!auth.user) {
    return { ok: false, error: auth.error ?? 'Not authenticated' }
  }

  const { data: course, error: courseError } = await getAcademyCourseById(courseId)
  if (courseError || !course) {
    return { ok: false, error: 'Course not found' }
  }

  const denied = courseAccessDeniedReason(
    (course.difficulty as string) ?? '',
    auth.tier
  )
  if (denied) {
    return { ok: false, error: denied }
  }

  const { data: existing } = await getUserCourseEnrollment(auth.user.id, courseId)
  if (existing) {
    revalidateAcademyPaths(courseId)
    return { ok: true }
  }

  const { error } = await auth.supabase.from('user_courses').insert([
    {
      user_id: auth.user.id,
      course_id: courseId,
      progress_percentage: 0,
    },
  ])

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidateAcademyPaths(courseId)
  return { ok: true }
}

export async function completeLesson(
  lessonId: string,
  courseId: string
): Promise<{ ok: true; progress: number; completed: boolean } | { ok: false; error: string }> {
  const auth = await getAuthenticatedUser()
  if (!auth.user) {
    return { ok: false, error: auth.error ?? 'Not authenticated' }
  }

  const [{ data: course }, { data: lessons }, { data: enrollment }] = await Promise.all([
    getAcademyCourseById(courseId),
    getAcademyLessonsByCourseId(courseId),
    getUserCourseEnrollment(auth.user.id, courseId),
  ])

  if (!course) {
    return { ok: false, error: 'Course not found' }
  }

  const denied = courseAccessDeniedReason(
    (course.difficulty as string) ?? '',
    auth.tier
  )
  if (denied) {
    return { ok: false, error: denied }
  }

  if (!enrollment) {
    return { ok: false, error: 'Enroll in the course before completing lessons' }
  }

  const lesson = lessons?.find((row) => row.id === lessonId)
  if (!lesson) {
    return { ok: false, error: 'Lesson not found' }
  }

  const { error: progressError } = await auth.supabase.from('user_lesson_progress').upsert(
    [
      {
        user_id: auth.user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'user_id,lesson_id' }
  )

  if (progressError) {
    return { ok: false, error: progressError.message }
  }

  const totalLessons = lessons?.length ?? 0
  const lessonIds = (lessons ?? []).map((row) => row.id as string)
  const { count: completedCount, error: countError } = await auth.supabase
    .from('user_lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .in('lesson_id', lessonIds)

  if (countError) {
    return { ok: false, error: countError.message }
  }

  const completedLessons = completedCount ?? 0
  const progress =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0
  const courseCompleted = progress >= 100

  const { error: updateError } = await auth.supabase
    .from('user_courses')
    .update({
      progress_percentage: progress,
      completed_at: courseCompleted ? new Date().toISOString() : null,
    })
    .eq('user_id', auth.user.id)
    .eq('course_id', courseId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidateAcademyPaths(courseId)
  return { ok: true, progress, completed: courseCompleted }
}
