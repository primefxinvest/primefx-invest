export function formatCurrency(amount: number, options?: { signed?: boolean }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  if (options?.signed) {
    if (amount > 0) return `+${formatted}`
    if (amount < 0) return `-${formatted}`
  }

  return formatted
}

export function formatPercent(value: number, options?: { signed?: boolean }) {
  const formatted = `${Math.abs(value).toFixed(2)}%`
  if (options?.signed) {
    if (value > 0) return `+${formatted}`
    if (value < 0) return `-${formatted}`
  }
  return formatted
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return 'Recently'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

export function toNumber(value?: number | string | null) {
  if (value === null || value === undefined) return 0
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
