'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { Bot, Globe, Headphones, Shield, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'
import './hero-features.css'

type PillarConfig = {
  titleKey: 'pillarSecureTitle' | 'pillarAiTitle' | 'pillarGlobalTitle' | 'pillarSupportTitle'
  subtitleKey:
    | 'pillarSecureSubtitle'
    | 'pillarAiSubtitle'
    | 'pillarGlobalSubtitle'
    | 'pillarSupportSubtitle'
  icon: LucideIcon
}

const pillars: PillarConfig[] = [
  { titleKey: 'pillarSecureTitle', subtitleKey: 'pillarSecureSubtitle', icon: Shield },
  { titleKey: 'pillarAiTitle', subtitleKey: 'pillarAiSubtitle', icon: Bot },
  { titleKey: 'pillarGlobalTitle', subtitleKey: 'pillarGlobalSubtitle', icon: Globe },
  { titleKey: 'pillarSupportTitle', subtitleKey: 'pillarSupportSubtitle', icon: Headphones },
]

function HeroFeatureCards() {
  const t = useTranslations('landing.hero')
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [animationsActive, setAnimationsActive] = useState(false)

  useEffect(() => {
    if (reduced) return

    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setAnimationsActive(entry.isIntersecting),
      { rootMargin: '60px', threshold: 0 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [reduced])

  const paused = reduced || !animationsActive

  return (
    <div
      ref={containerRef}
      className={cn(
        'mx-auto mt-5 grid w-full max-w-sm grid-cols-2 gap-x-4 gap-y-5 sm:max-w-lg sm:gap-x-6 sm:gap-y-6 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-8',
        paused && 'hero-features-paused'
      )}
    >
      {pillars.map(({ titleKey, subtitleKey, icon: Icon }, index) => (
        <div
          key={titleKey}
          className={cn(
            'hero-feature-item flex flex-col items-center gap-1.5 text-center sm:gap-2',
            `hero-feature-item--${index}`
          )}
        >
          <div className="hero-feature-icon flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0052ff] to-blue-600 sm:h-11 sm:w-11">
            <Icon className="h-4 w-4 text-white sm:h-[18px] sm:w-[18px]" aria-hidden />
          </div>
          <p className="text-[11px] font-bold leading-tight text-gray-900 sm:text-xs">
            {t(titleKey)}
          </p>
          <p className="text-[10px] leading-tight text-gray-500 sm:text-[11px]">
            {t(subtitleKey)}
          </p>
        </div>
      ))}
    </div>
  )
}

export default memo(HeroFeatureCards)
