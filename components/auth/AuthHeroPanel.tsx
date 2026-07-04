import {
  Headphones,
  PieChart,
  Shield,
  Users,
  Zap,
  Lock,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Logo from '@/components/shared/Logo'
import { AuthHeroChart } from '@/components/auth/AuthHeroChart'
import { AuthTrustBadge } from '@/components/auth/AuthTrustBadge'
import { cn } from '@/lib/utils'

export type AuthHeroVariant = 'login' | 'signup'

type AuthHeroPanelProps = {
  variant: AuthHeroVariant
  className?: string
}

const loginIcons = [Shield, Zap, PieChart, Headphones] as const
const signupIcons = [Shield, Users, Zap, Lock] as const

export async function AuthHeroPanel({ variant, className }: AuthHeroPanelProps) {
  const t = await getTranslations('auth')
  const isLogin = variant === 'login'

  const features = isLogin
    ? [
        { title: t('loginFeatureSecure'), desc: t('loginFeatureSecureDesc') },
        { title: t('loginFeatureInstant'), desc: t('loginFeatureInstantDesc') },
        { title: t('loginFeatureAnalytics'), desc: t('loginFeatureAnalyticsDesc') },
        { title: t('loginFeatureSupport'), desc: t('loginFeatureSupportDesc') },
      ]
    : [
        { title: t('signupFeatureSecure'), desc: t('signupFeatureSecureDesc') },
        { title: t('signupFeatureGlobal'), desc: t('signupFeatureGlobalDesc') },
        { title: t('signupFeatureWithdrawals'), desc: t('signupFeatureWithdrawalsDesc') },
        { title: t('signupFeatureProtected'), desc: t('signupFeatureProtectedDesc') },
      ]

  const icons = isLogin ? loginIcons : signupIcons

  return (
    <aside
      className={cn(
        'relative hidden min-h-[280px] flex-col justify-between overflow-hidden bg-[#0a1628] px-6 py-8 text-white sm:px-8 sm:py-10 lg:flex lg:min-h-screen lg:w-[min(46%,520px)] lg:shrink-0 lg:px-10 lg:py-12 xl:w-[min(44%,560px)]',
        className
      )}
      aria-hidden={false}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(0,82,255,0.35) 0%, transparent 42%), radial-gradient(circle at 85% 75%, rgba(16,185,129,0.2) 0%, transparent 38%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative z-[1]">
        <Logo showText sizeKey="authHero" variant="onDark" priority />

        <div className="mt-10 max-w-md">
          <h2 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl xl:text-[2.65rem]">
            {isLogin ? (
              <>
                {t('loginHeroTitleLine1')}
                <br />
                {t('loginHeroTitleLine2')}
                <br />
                <span className="text-[#3b82f6]">{t('loginHeroTitleHighlight')}</span>
              </>
            ) : (
              <>
                {t('signupHeroTitleLine1')}
                <br />
                {t('signupHeroTitleLine2')}
                <br />
                <span className="text-[#3b82f6]">{t('signupHeroTitleHighlight')}</span>
              </>
            )}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-[15px]">
            {isLogin ? t('loginHeroSubtitle') : t('signupHeroSubtitle')}
          </p>
        </div>

        <AuthHeroChart className="pointer-events-none mt-8 h-28 w-full max-w-md opacity-90 sm:h-32 lg:mt-10" />

        <ul className="mt-8 space-y-4 sm:mt-10">
          {features.map((feature, index) => {
            const Icon = icons[index] ?? Shield
            return (
              <li key={feature.title} className="flex gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5">
                  <Icon className="h-[18px] w-[18px] text-[#60a5fa]" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/65 sm:text-[13px]">
                    {feature.desc}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="relative z-[1] mt-8 lg:mt-10">
        <AuthTrustBadge />
      </div>
    </aside>
  )
}

export async function AuthMobileHero({ variant }: { variant: AuthHeroVariant }) {
  const t = await getTranslations('auth')
  const isLogin = variant === 'login'

  return (
    <section className="relative overflow-hidden bg-[#0a1628] px-4 py-6 text-white sm:px-6 lg:hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(0,82,255,0.4) 0%, transparent 50%)',
        }}
      />
      <div className="relative flex flex-col items-center text-center">
        <Logo showText sizeKey="authForm" variant="onDark" priority />
        <h2 className="mt-4 text-xl font-bold leading-tight sm:text-2xl">
          {isLogin ? t('loginHeroTitleLine1') : t('signupHeroTitleLine1')}
          <br />
          <span className="text-[#3b82f6]">
            {isLogin ? t('loginHeroTitleHighlight') : t('signupHeroTitleHighlight')}
          </span>
        </h2>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70 sm:text-sm">
          {isLogin ? t('loginHeroSubtitle') : t('signupHeroSubtitle')}
        </p>
      </div>
    </section>
  )
}
