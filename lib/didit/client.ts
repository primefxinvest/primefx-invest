import 'server-only'

import {
  getDiditApiKey,
  getDiditVerificationBaseUrl,
  getDiditWorkflowId,
  getVerificationCallbackUrl,
} from '@/lib/didit/env'

export type DiditVerificationStatus =
  | 'Approved'
  | 'Declined'
  | 'In Review'
  | 'In Progress'
  | 'Not Started'
  | 'Abandoned'
  | 'Expired'
  | 'KYC Expired'
  | 'Resubmitted'

export interface DiditCreateSessionResponse {
  session_id: string
  session_kind?: 'user' | 'business'
  session_number?: number
  session_token?: string
  url: string
  status: DiditVerificationStatus | string
  workflow_id?: string
  workflow_version?: number
  vendor_data?: string
  metadata?: Record<string, unknown>
  callback?: string
}

export interface DiditSessionDecision {
  session_id?: string
  status?: DiditVerificationStatus | string
  decision?: Record<string, unknown>
  vendor_data?: string
  metadata?: Record<string, unknown>
}

function assertDiditConfigured() {
  const apiKey = getDiditApiKey()
  const workflowId = getDiditWorkflowId()
  if (!apiKey) {
    throw new Error('DIDIT_API_KEY is not configured.')
  }
  if (!workflowId) {
    throw new Error('DIDIT_WORKFLOW_ID is not configured.')
  }
  return { apiKey, workflowId }
}

function wrapDiditFetchError(path: string, error: unknown): Error {
  if (error instanceof TypeError && error.message === 'fetch failed') {
    const cause = (error as Error & { cause?: NodeJS.ErrnoException & { hostname?: string } }).cause
    if (cause?.code === 'ENOTFOUND') {
      return new Error(
        `Could not reach Didit verification API (${cause.hostname ?? 'unknown host'}). Check NEXT_VERIFICATION_BASE_URL (default https://verification.didit.me).`
      )
    }
    return new Error(`Network error calling Didit API ${path}: ${cause?.message ?? error.message}`)
  }
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Didit verification API auth: long-lived API key on x-api-key header only.
 * @see https://docs.didit.me/getting-started/api-authentication
 */
async function diditRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey } = assertDiditConfigured()
  const baseUrl = getDiditVerificationBaseUrl()

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })
  } catch (error) {
    throw wrapDiditFetchError(path, error)
  }

  if (!response.ok) {
    const detail = await response.text()
    if (response.status === 401) {
      throw new Error(
        'Didit API rejected the API key (401). Verify DIDIT_API_KEY in your Didit dashboard application credentials.'
      )
    }
    throw new Error(`Didit API ${path} failed (${response.status}): ${detail}`)
  }

  return (await response.json()) as T
}

export async function createDiditVerificationSession(input: {
  userId: string
  email?: string | null
}): Promise<DiditCreateSessionResponse> {
  const { workflowId } = assertDiditConfigured()

  return diditRequest<DiditCreateSessionResponse>('/v3/session/', {
    method: 'POST',
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: input.userId,
      callback: getVerificationCallbackUrl(),
      metadata: {
        user_id: input.userId,
        ...(input.email ? { email: input.email } : {}),
      },
    }),
  })
}

export async function fetchDiditSessionDecision(
  sessionId: string
): Promise<DiditSessionDecision> {
  return diditRequest<DiditSessionDecision>(`/v3/session/${sessionId}/decision/`)
}

/** @see https://docs.didit.me/sessions-api/update-status */
export async function updateDiditSessionStatus(
  sessionId: string,
  newStatus: 'Approved' | 'Declined' | 'Resubmitted',
  comment?: string
): Promise<Record<string, unknown>> {
  return diditRequest<Record<string, unknown>>(`/v3/session/${sessionId}/update-status/`, {
    method: 'PATCH',
    body: JSON.stringify({
      new_status: newStatus,
      ...(comment ? { comment } : {}),
    }),
  })
}
