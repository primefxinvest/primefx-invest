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
    return {
      brand: 'text-[16px] font-extrabold tracking-[-0.02em]',
      tagline: 'text-[10px] font-bold tracking-[0.22em]',
      stack: 'gap-px',
    }
  }
  if (markSize >= 36) {
    return {
      brand: 'text-[15px] font-extrabold tracking-[-0.02em]',
      tagline: 'text-[9px] font-bold tracking-[0.2em]',
      stack: 'gap-px',
    }
  }
  return {
    brand: 'text-[13px] font-bold tracking-[-0.01em]',
    tagline: 'text-[8px] font-semibold tracking-[0.18em]',
    stack: 'gap-0',
  }
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
  const gapClass = markSize >= 40 ? 'gap-3.5' : markSize >= 36 ? 'gap-3' : 'gap-2.5'
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
        <div className={cn('flex min-w-0 flex-col justify-center leading-none', textScale.stack)}>
          <span
            className={cn(
              'block truncate antialiased',
              textScale.brand,
              onDark ? 'text-white' : 'text-gray-900'
            )}
          >
            PrimeFx
          </span>
          <span
            className={cn(
              'block uppercase antialiased',
              textScale.tagline,
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
