export const REFERRAL_SHARE_TEXT =
  'Join me on PrimeFx Invest and start investing smarter with AI-powered strategies.'

export function buildReferralLink(origin: string, referralCode: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}/signup?ref=${encodeURIComponent(referralCode.trim())}`
}

export function buildReferralShareUrl(channel: string, link: string): string {
  const text = `${REFERRAL_SHARE_TEXT} Use my referral link: ${link}`

  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(text)}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    case 'email':
      return `mailto:?subject=${encodeURIComponent('Join PrimeFx Invest')}&body=${encodeURIComponent(text)}`
    default:
      return link
  }
}

export async function copyReferralText(value: string): Promise<boolean> {
  if (!value || typeof navigator === 'undefined') return false

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export async function shareReferralLink(link: string, title = 'Join PrimeFx Invest'): Promise<boolean> {
  if (!link || typeof navigator === 'undefined' || !navigator.share) return false

  try {
    await navigator.share({
      title,
      text: REFERRAL_SHARE_TEXT,
      url: link,
    })
    return true
  } catch {
    return false
  }
}
