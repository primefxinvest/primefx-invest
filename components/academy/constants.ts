import {
  BarChart3,
  BookOpen,
  Brain,
  Globe,
  Landmark,
  LineChart,
  PieChart,
  Shield,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export const DIFFICULTY_FILTERS = ['all', 'beginner', 'intermediate', 'advanced', 'expert'] as const
export type DifficultyFilter = (typeof DIFFICULTY_FILTERS)[number]

export const difficultyStyles: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  intermediate: 'bg-blue-50 text-[#0052ff] ring-blue-100',
  advanced: 'bg-violet-50 text-violet-700 ring-violet-100',
  expert: 'bg-amber-50 text-amber-700 ring-amber-100',
}

export const courseIconStyles: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-blue-50', text: 'text-[#0052ff]' },
  fundamentals: { bg: 'bg-blue-50', text: 'text-[#0052ff]' },
  advanced: { bg: 'bg-violet-50', text: 'text-violet-600' },
  markets: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
}

const titleIconRules: { match: RegExp; icon: LucideIcon }[] = [
  { match: /investing basics|fundamentals/i, icon: BookOpen },
  { match: /risk/i, icon: Shield },
  { match: /technical/i, icon: LineChart },
  { match: /portfolio/i, icon: PieChart },
  { match: /forex|currency/i, icon: Globe },
  { match: /strateg/i, icon: TrendingUp },
  { match: /psychology|market psych/i, icon: Brain },
  { match: /economic|macro/i, icon: Landmark },
  { match: /wealth|building/i, icon: BarChart3 },
]

export function getCourseIcon(title: string, category: string): LucideIcon {
  for (const rule of titleIconRules) {
    if (rule.match.test(title)) return rule.icon
  }

  const categoryKey = category.toLowerCase()
  if (categoryKey.includes('market')) return Globe
  if (categoryKey.includes('advanced')) return TrendingUp
  return BookOpen
}

export function getCourseIconStyle(category: string) {
  const key = category.toLowerCase()
  if (key.includes('advanced')) return courseIconStyles.advanced
  if (key.includes('market')) return courseIconStyles.markets
  if (key.includes('fundamental')) return courseIconStyles.fundamentals
  return courseIconStyles.default
}

export function normalizeDifficulty(value: string) {
  return value.trim().toLowerCase()
}
