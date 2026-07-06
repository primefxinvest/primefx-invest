import type { AssistanceCategory } from '@/lib/assistance/types'

export const ASSISTANCE_QUICK_ACTIONS: {
  key: AssistanceCategory
  promptKey: string
}[] = [
  { key: 'deposits', promptKey: 'depositHelp' },
  { key: 'withdrawals', promptKey: 'withdrawalHelp' },
  { key: 'verification', promptKey: 'verifyIdentity' },
  { key: 'investments', promptKey: 'investmentHelp' },
  { key: 'referral', promptKey: 'referralHelp' },
  { key: 'security', promptKey: 'securityHelp' },
]

export const HUMAN_SUPPORT_PHRASES = [
  'human',
  'agent',
  'specialist',
  'real person',
  'speak to someone',
  'talk to support',
  'connect me',
  'live support',
  'customer service',
]

export const ESCALATION_MARKER = '[ESCALATE:'
export const ESCALATION_MARKER_END = ']'

export const ASSISTANCE_ATTACHMENT_BUCKET = 'assistance-attachments'
export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]
