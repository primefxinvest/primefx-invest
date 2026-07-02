export function formatPrimeFxId(userId: string): string {
  return `PFX${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

