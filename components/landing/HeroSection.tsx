'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { m } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Globe,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import LandingNav from './LandingNav'
import HeroBackground from './hero/HeroBackground'
import HeroDashboardScene from './hero/HeroDashboardScene'
import HeroStatsBar from './hero/HeroStatsBar'
import HeroScrollIndicator from './hero/HeroScrollIndicator'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { MOTION_EASING } from '@/lib/motion/tokens'
import { cn } from '@/lib/utils'

const trustIcons = [Shield, Bot, Globe, CheckCircle2, Zap, Sparkles]
const trustKeys = [
  'featureSecure',
  'featureAi',
  'featureGlobal',
  'featureRegulated',
  'featureFastWithdrawals',
  'featureVerified',
] as const

const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor4',
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: MOTION_EASING.out },
  },
}

export default function HeroSection() {
  const t = useTranslations('landing.hero')
  const { loading, isAuthenticated, dashboardHref, signupHref } = useAuthEntry()
  const reduced = useReducedMotion()
  const primaryHref = isAuthenticated ? dashboardHref : signupHref
  const primaryLabel = isAuthenticated ? t('ctaDashboard') : t('ctaStart')

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-white">
      <HeroBackground />
      <LandingNav />

      <div className="relative mx-auto max-w-8xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-28">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10 xl:gap-16">
          <m.div
            className="text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <m.div variants={itemVariants} className="mb-7 inline-flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-4 py-2 shadow-sm shadow-blue-500/5 backdrop-blur-md">
                <m.span
                  animate={reduced ? undefined : { rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#0052ff]" />
                </m.span>
                <span className="text-xs font-semibold tracking-[0.12em] text-[#0052ff]">
                  {t('badge')}
                </span>
              </span>
            </m.div>

            <m.h1
              variants={itemVariants}
              className="text-[2.5rem] font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]"
            >
              {t('titleLine1')}{' '}
              <span className="bg-gradient-to-r from-[#0052ff] via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
              <br />
              <span className="text-gray-800">{t('titleLine2')}</span>
            </m.h1>

            <m.p
              variants={itemVariants}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg lg:mx-0"
            >
              {t('subtitle')}
            </m.p>

            <m.div
              variants={itemVariants}
              className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:gap-3"
            >
              {trustKeys.map((key, index) => {
                const Icon = trustIcons[index]
                return (
                  <m.div
                    key={key}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/60 px-3 py-2.5 shadow-sm backdrop-blur-md transition-shadow',
                      index === 5 && 'col-span-2 sm:col-span-1'
                    )}
                    whileHover={reduced ? undefined : { y: -2, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  >
                    <m.div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/80"
                      animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.25,
                        ease: 'easeInOut',
                      }}
                    >
                      <Icon className="h-4 w-4 text-[#0052ff]" />
                    </m.div>
                    <span className="text-left text-[11px] font-semibold leading-tight text-gray-700 sm:text-xs">
                      {t(key)}
                    </span>
                  </m.div>
                )
              })}
            </m.div>

            <m.div
              variants={itemVariants}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <m.div whileHover={reduced ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={primaryHref}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#0052ff] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 sm:w-auto"
                >
                  <m.span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={reduced ? undefined : { x: ['-120%', '120%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                  <span className="relative">{loading ? t('ctaStart') : primaryLabel}</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </m.div>

              <m.div whileHover={reduced ? undefined : { scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/how-primefx-works"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200/80 bg-white/70 px-8 py-4 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur-md transition-colors hover:border-[#0052ff]/30 hover:bg-blue-50/50 hover:text-[#0052ff] sm:w-auto"
                >
                  {t('ctaHowItWorks')}
                </Link>
              </m.div>
            </m.div>

            <m.div
              variants={itemVariants}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-center lg:justify-start"
            >
              <div className="flex -space-x-2.5">
                {avatars.map((src, i) => (
                  <m.img
                    key={i}
                    src={src}
                    alt=""
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-100 shadow-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                  />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {t('trustedBy', { count: '120,000+' })}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1 sm:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 text-xs font-bold text-gray-800">4.9/5</span>
                  <span className="text-xs text-gray-500">{t('reviews', { count: '2,350' })}</span>
                </div>
              </div>
            </m.div>
          </m.div>

          <div className="relative">
            <HeroDashboardScene />
          </div>
        </div>
      </div>

      <HeroStatsBar />
      <HeroScrollIndicator />
    </section>
  )
}
