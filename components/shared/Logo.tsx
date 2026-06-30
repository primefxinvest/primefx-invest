import Image from 'next/image'
import NextLink from 'next/link'
import { Link as I18nLink } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  showText?: boolean
  tagline?: string
  size?: number
  className?: string
}

export default function Logo({ href, showText = true, tagline = 'INVEST', size = 40, className }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logo.png"
        alt="PrimeFx Invest"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        priority
      />
      {showText && (
        <div className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-bold tracking-tight text-gray-900">PrimeFx</span>
          <span className="block text-[9px] font-semibold tracking-widest text-[#0052ff]">{tagline}</span>
        </div>
      )}
    </div>
  )

  if (href) {
    const LinkComponent = href.startsWith('/admin') ? NextLink : I18nLink
    return (
      <LinkComponent href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </LinkComponent>
    )
  }

  return content
}
