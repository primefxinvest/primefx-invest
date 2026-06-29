import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Star, Quote } from 'lucide-react'

const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
]

export default async function TestimonialsSection() {
  const t = await getTranslations('landing.testimonials')
  const items = t.raw('items') as Array<{ quote: string; name: string; role: string }>

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">{t('eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">{t('title')}</h2>
          </div>
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
          >
            {t('viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map(({ quote, name, role }, index) => (
            <div
              key={name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <Quote className="mb-3 h-6 w-6 text-[#0052ff]/30" />
              <p className="flex-1 text-sm leading-relaxed text-gray-600">&ldquo;{quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-5">
                <img src={avatars[index]} alt={name} className="h-10 w-10 rounded-full bg-gray-100" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
