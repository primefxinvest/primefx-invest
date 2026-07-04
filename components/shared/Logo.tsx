import Image from 'next/image'
import NextLink from 'next/link'
import { Link as I18nLink } from '@/i18n/navigation'
import { LOGO_SIZES, type LogoSizeKey } from '@/lib/layout/logo'
import { cn } from '@/lib/utils'

type LogoVariant = 'default' | 'onDark'

interface LogoProps {
  href?: string
  showText?: boolean
  tagline?: string
  size?: number
  sizeKey?: LogoSizeKey
  variant?: LogoVariant
  className?: string
  priority?: boolean
}

function textScaleForMark(markSize: number) {
  if (markSize >= 44) {
    return { brand: 'text-[15px]', tagline: 'text-[10px]', tracking: 'tracking-[0.14em]' }
  }
  if (markSize >= 36) {
    return { brand: 'text-[14px]', tagline: 'text-[9px]', tracking: 'tracking-[0.16em]' }
  }
  return { brand: 'text-[13px]', tagline: 'text-[8px]', tracking: 'tracking-[0.18em]' }
}

export default function Logo({
  href,
  showText = true,
  tagline = 'INVEST',
  size,
  sizeKey,
  variant = 'default',
  className,
  priority = false,
}: LogoProps) {
  const markSize = size ?? (sizeKey ? LOGO_SIZES[sizeKey] : LOGO_SIZES.sidebarFull)
  const textScale = textScaleForMark(markSize)
  const gapClass = markSize >= 40 ? 'gap-3' : 'gap-2.5'
  const onDark = variant === 'onDark'
  const retinaSize = markSize * 2

  const content = (
    <div className={cn('inline-flex items-center', gapClass, className)}>
      <Image
        src="/logo.png"
        alt="PrimeFx Invest"
        width={retinaSize}
        height={retinaSize}
        sizes={`${markSize}px`}
        className="shrink-0 object-contain"
        style={{ width: markSize, height: markSize, maxWidth: markSize, maxHeight: markSize }}
        priority={priority}
        quality={100}
        draggable={false}
      />
      {showText ? (
        <div className="flex min-w-0 flex-col justify-center gap-0.5 leading-none">
          <span
            className={cn(
              'block truncate font-bold tracking-tight antialiased',
              textScale.brand,
              onDark ? 'text-white' : 'text-gray-900'
            )}
          >
            PrimeFx
          </span>
          <span
            className={cn(
              'block font-semibold uppercase antialiased',
              textScale.tagline,
              textScale.tracking,
              onDark ? 'text-[#60a5fa]' : 'text-[#0052ff]'
            )}
          >
            {tagline}
          </span>
        </div>
      ) : null}
    </div>
  )

  if (href) {
    const LinkComponent = href.startsWith('/admin') ? NextLink : I18nLink
    return (
      <LinkComponent href={href} className="inline-flex transition-opacity hover:opacity-90">
        {content}
      </LinkComponent>
    )
  }

  return content
}
