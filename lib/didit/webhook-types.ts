export const DIDIT_WEBHOOK_TYPES = [
  'status.updated',
  'data.updated',
  'user.status.updated',
  'user.data.updated',
  'business.status.updated',
  'business.data.updated',
  'activity.created',
  'transaction.created',
  'transaction.status.updated',
] as const

export type DiditWebhookType = (typeof DIDIT_WEBHOOK_TYPES)[number]

export type DiditSessionStatus =
  | 'Approved'
  | 'Declined'
  | 'In Review'
  | 'In Progress'
  | 'Not Started'
  | 'Abandoned'
  | 'Expired'
  | 'KYC Expired'
  | 'Resubmitted'

export type DiditEntityStatus = 'ACTIVE' | 'FLAGGED' | 'BLOCKED'

export type DiditTransactionStatus = 'APPROVED' | 'IN_REVIEW' | 'DECLINED' | 'AWAITING_USER'

export interface DiditWebhookEnvelope {
  event_id: string
  webhook_type: DiditWebhookType | string
  timestamp: number
  created_at?: number
  application_id?: string
  environment?: 'live' | 'sandbox'
  status?: string
  session_id?: string
  business_session_id?: string
  session_kind?: 'business'
  workflow_id?: string
  workflow_version?: number
  vendor_data?: string
  vendor_user_id?: string
  vendor_business_id?: string
  metadata?: Record<string, unknown>
  trigger?: string
  decision?: Record<string, unknown>
  resubmit_info?: {
    nodes_to_resubmit?: string[]
    reasons?: Record<string, unknown>
  }
  previous_status?: string
  changed_fields?: string[]
  changes?: Record<string, { previous?: unknown; current?: unknown }>
  transaction_id?: string
  txn_id?: string
  score?: number
  severity?: string
  amount?: string
  currency?: string
  direction?: string
}

export type DiditSignatureMethod = 'v2' | 'raw' | 'simple'
