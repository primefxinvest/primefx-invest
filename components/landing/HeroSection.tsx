'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowRight,
  Star,
  Shield,
  Bot,
  TrendingUp,
  Globe,
  Users,
  DollarSign,
  MapPin,
  Lock,
} from 'lucide-react'
import LandingNav from './LandingNav'
import DashboardMockup from './DashboardMockup'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'

const featureIcons = [Shield, Bot, TrendingUp, Globe]
const statIcons = [Users, DollarSign, TrendingUp, MapPin, Lock]
const statValues = ['120,000+', '$250M+', '+24.8%', '150+', '100%']
const statColors = [
  'bg-blue-100 text-[#0052ff]',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
  'bg-orange-100 text-orange-600',
  'bg-blue-100 text-[#0052ff]',
]

const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor4',
]

export default function HeroSection() {
  const t = useTranslations('landing.hero')
  const { loading, isAuthenticated, dashboardHref, signupHref } = useAuthEntry()
  const primaryHref = isAuthenticated ? dashboardHref : signupHref
  const primaryLabel = isAuthenticated ? t('ctaDashboard') : t('ctaStart')

  const features = [
    t('featureSecure'),
    t('featureAi'),
    t('featureReturns'),
    t('featureGlobal'),
  ]

  const stats = [
    t('statInvestors'),
    t('statAum'),
    t('statReturns'),
    t('statCountries'),
    t('statSecure'),
  ]

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-blue-50/80 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <LandingNav />

      <div className="relative mx-auto max-w-8xl px-4 pb-8 pt-24 sm:px-6 lg:px-8 lg:pb-12 lg:pt-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5">
              <Star className="h-3.5 w-3.5 fill-[#0052ff] text-[#0052ff]" />
              <span className="text-xs font-semibold tracking-wide text-[#0052ff]">{t('badge')}</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              {t('titleLine1')}{' '}
              <span className="text-[#0052ff]">{t('titleHighlight')}</span>{' '}
              {t('titleLine2')}
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-gray-600 lg:mx-0 lg:text-lg">
              {t('subtitle')}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
              {features.map((label, index) => {
                const Icon = featureIcons[index]
                return (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-2 py-3 lg:items-start lg:px-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-4 w-4 text-[#0052ff]" />
                    </div>
                    <span className="text-center text-xs font-medium leading-tight text-gray-700 lg:text-left">
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href={primaryHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 sm:w-auto"
              >
                {loading ? t('ctaStart') : primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-primefx-works"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0052ff] bg-white px-8 py-3.5 text-sm font-semibold text-[#0052ff] transition-colors hover:bg-blue-50 sm:w-auto"
              >
                {t('ctaHowItWorks')}
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-center lg:justify-start">
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-white bg-gray-200"
                  />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-gray-700">
                  {t('trustedBy', { count: '120,000+' })}
                </p>
                <div className="mt-0.5 flex items-center justify-center gap-1 sm:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-semibold text-gray-700">4.9/5</span>
                  <span className="text-xs text-gray-500">{t('reviews', { count: '2,350' })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pb-20 pt-4 lg:pb-24">
            <DashboardMockup />
          </div>
        </div>
      </div>

      <div className="relative border-t border-gray-200 bg-gray-50/80">
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {stats.map((label, index) => {
              const Icon = statIcons[index]
              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statColors[index]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{statValues[index]}</p>
                    <p className="text-xs leading-tight text-gray-500">{label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
