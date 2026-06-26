'use client'

import { BookOpen, Play, CheckCircle, Lock, BarChart3, TrendingUp, DollarSign, Globe } from 'lucide-react'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessFeature } from '@/lib/investor/tiers'

export default function AcademyPage() {
  const { tierKey } = useInvestorTier()
  const canAccessAdvanced = canAccessFeature(tierKey, 'portfolio_analysis')

  const courses = [
    {
      id: '1',
      title: 'Investing Basics',
      category: 'Fundamentals',
      lessons: 12,
      duration: '4 weeks',
      difficulty: 'Beginner',
      progress: 75,
      icon: BookOpen,
    },
    {
      id: '2',
      title: 'Risk Management',
      category: 'Advanced',
      lessons: 8,
      duration: '2 weeks',
      difficulty: 'Intermediate',
      progress: 50,
      icon: BarChart3,
    },
    {
      id: '3',
      title: 'Wealth Building Strategies',
      category: 'Advanced',
      lessons: 15,
      duration: '6 weeks',
      difficulty: 'Advanced',
      progress: 0,
      icon: TrendingUp,
      locked: !canAccessAdvanced,
      lockReason: 'Prime Investor',
    },
    {
      id: '4',
      title: 'Forex Basics',
      category: 'Markets',
      lessons: 10,
      duration: '3 weeks',
      difficulty: 'Beginner',
      progress: 100,
      icon: Globe,
      completed: true,
    },
    {
      id: '5',
      title: 'Cryptocurrency Investing',
      category: 'Markets',
      lessons: 12,
      duration: '4 weeks',
      difficulty: 'Intermediate',
      progress: 30,
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Academy</h1>
        <p className="mt-1 text-muted-foreground">Learn investing strategies and financial literacy from industry experts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Courses Completed</p>
          <p className="mt-2 text-3xl font-bold text-foreground">1 of 5</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Learning Streak</p>
          <p className="mt-2 text-3xl font-bold text-primary">7 days</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">XP Earned</p>
          <p className="mt-2 text-3xl font-bold text-foreground">1,250</p>
        </div>
      </div>

      {/* Courses */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Available Courses</h2>
        <div className="space-y-4">
          {courses.map((course) => {
            const Icon = course.icon
            return (
              <div
                key={course.id}
                className={`rounded-lg border p-6 transition-all hover:shadow-md ${
                  course.locked ? 'border-border bg-secondary opacity-60' : 'border-border hover:border-primary'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{course.category}</p>
                        </div>
                        {course.completed && <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                        {course.locked && <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{course.lessons} lessons</span>
                        <span>•</span>
                        <span>{course.duration}</span>
                        <span>•</span>
                        <span>{course.difficulty}</span>
                      </div>
                      {course.progress > 0 && !course.completed && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground">Progress</span>
                            <span className="text-xs text-muted-foreground">{course.progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors flex-shrink-0 ${
                      course.locked
                        ? 'border border-border text-muted-foreground cursor-not-allowed'
                        : course.completed
                          ? 'bg-secondary text-foreground'
                          : 'bg-primary text-white hover:bg-blue-700'
                    }`}
                    disabled={course.locked}
                  >
                    {course.completed ? 'Review' : course.progress > 0 ? 'Continue' : 'Start'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Certificates */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Certificates</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { name: 'Beginner Investor', earned: true, date: 'Earned on Mar 15, 2024' },
            { name: 'Advanced Trader', earned: false, progress: 'Complete 3 more courses' },
          ].map((cert, idx) => (
            <div key={idx} className={`rounded-lg border p-6 ${cert.earned ? 'bg-blue-50 border-blue-300' : 'border-border'}`}>
              <p className="font-semibold text-foreground">{cert.name}</p>
              {cert.earned ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  {cert.date}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{cert.progress}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
