import { Headphones, Shield } from 'lucide-react'
import { Link } from '@/i18n/navigation'

type AuthSecurityNoticeProps = {
  securityText: string
  showSupport?: boolean
  needHelpText?: string
  contactSupportText?: string
  contactHref?: string
}

export function AuthSecurityNotice({
  securityText,
  showSupport = false,
  needHelpText,
  contactSupportText,
  contactHref = '/contact',
}: AuthSecurityNoticeProps) {
  return (
    <div className="space-y-3 text-center text-xs text-muted-foreground sm:text-sm">
      {showSupport && needHelpText && contactSupportText ? (
        <p className="flex items-center justify-center gap-1.5">
          <Headphones className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>{needHelpText}</span>
          <Link href={contactHref} className="font-semibold text-primary hover:underline">
            {contactSupportText}
          </Link>
        </p>
      ) : null}
      <p className="flex items-center justify-center gap-1.5 leading-snug">
        <Shield className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
        <span>{securityText}</span>
      </p>
    </div>
  )
}
