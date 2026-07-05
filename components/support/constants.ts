export const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'] as const
export type FaqKey = (typeof FAQ_KEYS)[number]

export type QuickHelpItem = {
  id: string
  faqKey: FaqKey
}

export const QUICK_HELP_ITEMS: QuickHelpItem[] = [
  { id: 'withdrawals', faqKey: 'q5' },
  { id: 'referrals', faqKey: 'q7' },
  { id: 'deposit', faqKey: 'q8' },
  { id: 'rewards', faqKey: 'q6' },
  { id: 'investments', faqKey: 'q1' },
  { id: 'verification', faqKey: 'q3' },
]

export const SYSTEM_SERVICES = [
  'deposits',
  'withdrawals',
  'referrals',
  'primeai',
  'investments',
] as const

export const OPEN_STATUSES = new Set(['open', 'in-progress', 'in_progress'])
export const CLOSED_STATUSES = new Set(['resolved', 'closed'])

export function isOpenTicket(status: string) {
  return OPEN_STATUSES.has(status.toLowerCase())
}

export const SUPPORT_EMAIL = 'support@primefxinvest.com'
