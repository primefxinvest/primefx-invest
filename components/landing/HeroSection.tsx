'use client'

import dynamic from 'next/dynamic'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { m } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import LandingNav from './LandingNav'
import HeroBackground from './hero/HeroBackground'
import HeroFeatureCards from './hero/HeroFeatureCards'
import HeroRotatingHeadline from './hero/HeroRotatingHeadline'
import HeroMarquee from './hero/HeroMarquee'
import HeroDashboardSceneSkeleton from './hero/HeroDashboardSceneSkeleton'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'
import { MotionProvider } from '@/lib/motion/MotionProvider'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { MOTION_EASING } from '@/lib/motion/tokens'
import { HeroSceneErrorBoundary } from './hero/HeroSceneErrorBoundary'

const HeroDashboardScene = dynamic(() => import('./hero/HeroDashboardScene'), {
  loading: () => <HeroDashboardSceneSkeleton />,
})

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: MOTION_EASING.out },
  },
}

export default function HeroSection() {
  const t = useTranslations('landing.hero')
  const { loading, isAuthenticated, dashboardHref, signupHref } = useAuthEntry()
  const reduced = useReducedMotion()
  const primaryHref = isAuthenticated ? dashboardHref : signupHref
  const primaryLabel = isAuthenticated ? t('ctaDashboard') : t('ctaStart')

  return (
    <MotionProvider>
      <section className="relative overflow-hidden bg-white">
        <HeroBackground />
        <LandingNav />

        <div className="relative z-10 mx-auto max-w-8xl px-4 pb-10 pt-24 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16 lg:pt-28">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
            <m.div
              className="text-center lg:text-left"
              variants={containerVariants}
              initial={reduced ? false : 'hidden'}
              animate={reduced ? false : 'visible'}
            >
              <m.div variants={itemVariants} className="mb-5 inline-flex">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-4 py-2 shadow-sm shadow-blue-500/5 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#0052ff]" />
                  <span className="text-xs font-semibold tracking-[0.12em] text-[#0052ff]">
                    {t('badge')}
                  </span>
                </span>
              </m.div>

              <m.h1
                variants={itemVariants}
                className="text-[2.25rem] font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]"
              >
                {t('titleLine1')}{' '}
                <HeroRotatingHeadline />
                <br />
                <span className="text-gray-800">{t('titleLine2')}</span>
              </m.h1>

              <m.p
                variants={itemVariants}
                className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:mt-5 sm:text-lg lg:mx-0"
              >
                {t('subtitle')}
              </m.p>

              <m.div variants={itemVariants}>
                <HeroFeatureCards />
              </m.div>

              <m.div
                variants={itemVariants}
                className="mt-9 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row lg:justify-start"
              >
                <Link
                  href={primaryHref}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0052ff] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                >
                  <span>{loading ? t('ctaStart') : primaryLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/how-primefx-works"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200/80 bg-white/70 px-8 py-3.5 text-sm font-semibold text-gray-800 transition-colors hover:border-[#0052ff]/30 hover:bg-blue-50/50 hover:text-[#0052ff] active:scale-[0.98] sm:w-auto"
                >
                  {t('ctaHowItWorks')}
                </Link>
              </m.div>
            </m.div>

            <div className="relative w-full">
              <HeroSceneErrorBoundary>
                <HeroDashboardScene />
              </HeroSceneErrorBoundary>
            </div>
          </div>
        </div>

        <HeroMarquee />
      </section>
    </MotionProvider>
  )
}
