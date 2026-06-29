import { getTranslations } from 'next-intl/server'
import { Users, DollarSign, Globe, Star, Activity } from 'lucide-react'

const icons = [Users, DollarSign, Globe, Star, Activity]
const values = ['120,000+', '$250M+', '150+', '4.9/5', '99.9%']

export default async function GlobalImpactSection() {
  const t = await getTranslations('landing.globalImpact')
  const stats = t.raw('stats') as Array<{ label: string }>

  return (
    <section className="border-y border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-xs font-semibold tracking-widest text-[#0052ff]">
          {t('eyebrow')}
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {stats.map(({ label }, index) => {
            const Icon = icons[index]
            return (
              <div key={label} className="flex flex-col items-center text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-5 w-5 text-[#0052ff]" />
                </div>
                <p className="text-xl font-bold text-gray-900">{values[index]}</p>
                <p className="mt-0.5 text-xs text-gray-500">{label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
