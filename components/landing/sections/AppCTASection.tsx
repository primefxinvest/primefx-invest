import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { AppStoreBadge, GooglePlayBadge } from '@/components/landing/StoreBadges'
import PhoneMockup from '@/components/landing/PhoneMockup'
import { CTADecorations } from '@/components/landing/CTADecorations'

export default async function AppCTASection() {
  const t = await getTranslations('landing.appCta')

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="flex overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 p-6 sm:p-8 lg:min-h-[320px] lg:p-10">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-widest text-[#0052ff]">
                  {t('mobileEyebrow')}
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                  {t('mobileTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{t('mobileSubtitle')}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="transition-opacity hover:opacity-80"
                    aria-label={t('appStoreAria')}
                  >
                    <AppStoreBadge className="h-[40px] w-auto" />
                  </button>
                  <button
                    type="button"
                    className="transition-opacity hover:opacity-80"
                    aria-label={t('googlePlayAria')}
                  >
                    <GooglePlayBadge className="h-[40px] w-auto" />
                  </button>
                </div>
              </div>

              <div className="relative flex min-h-[280px] items-end justify-center overflow-hidden md:min-h-[300px] md:justify-end">
                <PhoneMockup half />
              </div>
            </div>
          </div>

          <div className="relative flex overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a2d7a] via-[#0052ff] to-[#1a6bff] p-6 sm:p-8 lg:min-h-[320px] lg:p-10">
            <div className="relative z-10 grid h-full grid-cols-1 items-center gap-6 md:grid-cols-2">
              <div className="text-left">
                <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {t('ctaTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-blue-100">{t('ctaSubtitle')}</p>
                <Link
                  href="/signup"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0052ff] shadow-lg transition-colors hover:bg-blue-50"
                >
                  {t('ctaButton')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="hidden md:block">
                <CTADecorations />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
