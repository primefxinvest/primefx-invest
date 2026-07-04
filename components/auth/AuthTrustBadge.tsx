import Image from 'next/image'
import { Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=investor4',
]

export async function AuthTrustBadge() {
  const t = await getTranslations('auth')

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <div className="flex -space-x-2.5">
        {AVATARS.map((src, index) => (
          <div
            key={src}
            className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[#0a1628] bg-white/10"
            style={{ zIndex: AVATARS.length - index }}
          >
            <Image
              src={src}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
      <p className="min-w-0 flex-1 text-xs leading-snug text-white/85 sm:text-sm">{t('trustBadge')}</p>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
        <span className="text-xs font-bold text-white">{t('trustRating')}</span>
      </div>
    </div>
  )
}
