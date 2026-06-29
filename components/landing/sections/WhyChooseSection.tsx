import { getTranslations } from 'next-intl/server'
import { Bot, Globe, Shield, Users, Eye, Headphones } from 'lucide-react'

const icons = [Bot, Globe, Shield, Users, Eye, Headphones]
const colors = [
  'bg-blue-100 text-[#0052ff]',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
  'bg-indigo-100 text-indigo-600',
  'bg-teal-100 text-teal-600',
  'bg-red-100 text-red-500',
]

export default async function WhyChooseSection() {
  const t = await getTranslations('landing.whyChoose')
  const features = t.raw('features') as Array<{ title: string; description: string }>

  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#0052ff]">{t('eyebrow')}</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">{t('title')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description }, index) => {
            const Icon = icons[index]
            return (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${colors[index]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
