import type { DiditSessionDecision } from './client'

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0)
}

/** Webhooks nest under `decision`; GET /v3/session/{id}/decision/ returns the report at the root. */
export function resolveDiditDecisionPayload(
  raw: DiditSessionDecision | Record<string, unknown>
): Record<string, unknown> | null {
  const payload = raw as Record<string, unknown>
  const nested = payload.decision

  if (isNonEmptyObject(nested)) {
    return nested
  }

  const report = { ...payload }
  delete report.decision

  return isNonEmptyObject(report) ? report : null
}

export function resolveDiditSessionStatus(
  raw: DiditSessionDecision | Record<string, unknown>
): string {
  const payload = raw as Record<string, unknown>
  const nested = payload.decision

  if (isNonEmptyObject(nested) && nested.status != null) {
    return String(nested.status)
  }

  if (payload.status != null) {
    return String(payload.status)
  }

  return 'In Progress'
}

export function resolveDiditVendorData(
  raw: DiditSessionDecision | Record<string, unknown>
): string | null {
  const payload = raw as Record<string, unknown>

  if (typeof payload.vendor_data === 'string' && payload.vendor_data.trim()) {
    return payload.vendor_data.trim()
  }

  const nested = payload.decision
  if (isNonEmptyObject(nested) && typeof nested.vendor_data === 'string') {
    return nested.vendor_data.trim()
  }

  return null
}

export function resolveDiditWorkflowId(
  raw: DiditSessionDecision | Record<string, unknown>
): string | null {
  const payload = raw as Record<string, unknown>

  if (typeof payload.workflow_id === 'string' && payload.workflow_id.trim()) {
    return payload.workflow_id.trim()
  }

  const metadata = payload.metadata
  if (isNonEmptyObject(metadata) && typeof metadata.workflow_id === 'string') {
    return metadata.workflow_id.trim()
  }

  return null
}

export function hasStoredDiditDecision(decision: Record<string, unknown> | null | undefined): boolean {
  if (!decision) return false
  return Object.keys(decision).length > 0
}

export function isSessionNotFoundDecision(decision: Record<string, unknown> | null | undefined): boolean {
  return decision?.reason === 'session_not_found'
}
