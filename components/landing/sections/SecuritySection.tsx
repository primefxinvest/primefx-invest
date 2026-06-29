import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Lock, Fingerprint, Server, ShieldCheck, Eye } from 'lucide-react'

const icons = [Lock, Fingerprint, Server, ShieldCheck, Eye]

export default async function SecuritySection() {
  const t = await getTranslations('landing.security')
  const features = t.raw('features') as string[]

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">{t('eyebrow')}</p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">{t('title')}</h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{t('subtitle')}</p>
            <Link
              href="/legal#compliance"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              {t('learnMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {features.map((label, index) => {
              const Icon = icons[index]
              return (
                <div key={label} className="flex w-28 flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                    <Icon className="h-5 w-5 text-[#0052ff]" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-gray-600">{label}</span>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl bg-[#0f1f4d] p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0052ff]/20">
              <ShieldCheck className="h-10 w-10 text-[#0052ff]" />
            </div>
            <h3 className="text-lg font-bold text-white">{t('cardTitle')}</h3>
            <p className="mt-3 text-sm leading-relaxed text-blue-200/80">{t('cardBody')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
