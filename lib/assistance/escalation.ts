import type { AssistanceCategory, EscalationSummary } from '@/lib/assistance/types'
import { ESCALATION_MARKER, ESCALATION_MARKER_END, HUMAN_SUPPORT_PHRASES } from '@/lib/assistance/constants'

export function userRequestsHumanSupport(message: string): boolean {
  const lower = message.toLowerCase()
  return HUMAN_SUPPORT_PHRASES.some((phrase) => lower.includes(phrase))
}

export function parseEscalationFromResponse(text: string): {
  cleanText: string
  shouldEscalate: boolean
  reason: string | null
} {
  const start = text.lastIndexOf(ESCALATION_MARKER)
  if (start === -1) {
    return { cleanText: text.trim(), shouldEscalate: false, reason: null }
  }

  const end = text.indexOf(ESCALATION_MARKER_END, start)
  if (end === -1) {
    return { cleanText: text.trim(), shouldEscalate: false, reason: null }
  }

  const reason = text.slice(start + ESCALATION_MARKER.length, end).trim()
  const cleanText = (text.slice(0, start) + text.slice(end + 1)).trim()

  return {
    cleanText,
    shouldEscalate: true,
    reason: reason || 'AI confidence low — manual review required',
  }
}

export function inferCategoryFromMessages(messages: { role: string; content: string }[]): AssistanceCategory {
  const combined = messages
    .map((m) => m.content.toLowerCase())
    .join(' ')

  if (/withdraw|payout|cash out/.test(combined)) return 'withdrawals'
  if (/deposit|fund|top.?up|payment/.test(combined)) return 'deposits'
  if (/kyc|verify|identity|document/.test(combined)) return 'verification'
  if (/invest|plan|portfolio|roi/.test(combined)) return 'investments'
  if (/refer|commission|invite/.test(combined)) return 'referral'
  if (/transfer|send money/.test(combined)) return 'transfers'
  if (/reward|bonus|points/.test(combined)) return 'rewards'
  if (/security|password|2fa|mfa|hack/.test(combined)) return 'security'
  if (/bug|error|crash|not working|technical/.test(combined)) return 'technical'
  if (/account|profile|settings/.test(combined)) return 'account'

  return 'general'
}

export function buildEscalationSummary(input: {
  messages: { role: string; content: string }[]
  kycStatus: string
  escalationReason: string
  aiActions?: string[]
}): EscalationSummary {
  const category = inferCategoryFromMessages(input.messages)
  const userMessages = input.messages.filter((m) => m.role === 'user')
  const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? 'Support request'

  const amountMatch = input.messages
    .map((m) => m.content)
    .join(' ')
    .match(/\$[\d,]+(?:\.\d{2})?/)

  const conversationSummary = input.messages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 200)}`)
    .join('\n')

  return {
    issue: lastUserMessage.slice(0, 120),
    category,
    kycStatus: input.kycStatus,
    amount: amountMatch?.[0],
    aiActions: input.aiActions ?? ['Reviewed account context', 'Attempted automated resolution'],
    escalationReason: input.escalationReason,
    conversationSummary,
  }
}

export function formatEscalationSummaryForTicket(summary: EscalationSummary): string {
  const lines = [
    `Issue: ${summary.issue}`,
    `Category: ${summary.category}`,
    `KYC: ${summary.kycStatus}`,
  ]

  if (summary.amount) lines.push(`Amount: ${summary.amount}`)
  lines.push(`AI Actions: ${summary.aiActions.join('; ')}`)
  lines.push(`Escalation Reason: ${summary.escalationReason}`)
  lines.push('', '--- Conversation ---', summary.conversationSummary)

  return lines.join('\n')
}
