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
  /** Explicit pixel size for the mark */
  size?: number
  /** Preset size from design system */
  sizeKey?: LogoSizeKey
  variant?: LogoVariant
  className?: string
  priority?: boolean
}

function textScaleForMark(markSize: number) {
  if (markSize >= 44) {
    return { brand: 'text-[15px]', tagline: 'text-[10px]' }
  }
  if (markSize >= 36) {
    return { brand: 'text-[13px]', tagline: 'text-[9px]' }
  }
  return { brand: 'text-[12px]', tagline: 'text-[8px]' }
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

  const content = (
    <div className={cn('flex items-center', gapClass, className)}>
      <Image
        src="/logo.png"
        alt="PrimeFx Invest"
        width={markSize}
        height={markSize}
        sizes={`${markSize}px`}
        className="shrink-0 object-contain"
        style={{ width: markSize, height: markSize }}
        priority={priority}
        quality={100}
      />
      {showText ? (
        <div className="min-w-0 leading-tight">
          <span
            className={cn(
              'block truncate font-bold tracking-tight',
              textScale.brand,
              onDark ? 'text-white' : 'text-gray-900'
            )}
          >
            PrimeFx
          </span>
          <span
            className={cn(
              'block font-semibold tracking-widest',
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
