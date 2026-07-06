export type AssistanceSessionStatus = 'active' | 'escalated' | 'resolved' | 'closed'

export type AssistanceCategory =
  | 'deposits'
  | 'withdrawals'
  | 'investments'
  | 'verification'
  | 'transfers'
  | 'referral'
  | 'portfolio'
  | 'rewards'
  | 'security'
  | 'technical'
  | 'account'
  | 'general'

export type AssistanceMessageRole = 'user' | 'assistant' | 'system' | 'agent'

export interface AssistanceAttachment {
  name: string
  path: string
  mimeType: string
  size: number
}

export interface AssistanceMessageMeta {
  attachments?: AssistanceAttachment[]
  readAt?: string
  escalationSuggested?: boolean
  escalationReason?: string
}

export interface AssistanceMessage {
  id: string
  role: AssistanceMessageRole
  content: string
  metadata: AssistanceMessageMeta
  createdAt: string
}

export interface AssistanceSession {
  id: string
  status: AssistanceSessionStatus
  category: AssistanceCategory | null
  escalationReason: string | null
  ticketId: string | null
  ticketNumber: string | null
  assignedAgentId: string | null
  createdAt: string
  updatedAt: string
}

export interface EscalationSummary {
  issue: string
  category: AssistanceCategory
  kycStatus: string
  amount?: string
  aiActions: string[]
  escalationReason: string
  conversationSummary: string
}

export interface AssistanceSessionPayload {
  session: AssistanceSession
  messages: AssistanceMessage[]
  hasAgentReply: boolean
}
