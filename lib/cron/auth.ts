import 'server-only'

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}
