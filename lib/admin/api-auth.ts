import 'server-only'

import { NextResponse } from 'next/server'
import { canAccessModule } from '@/lib/admin/permissions'
import { getAdminContext } from '@/lib/admin/auth'
import type { AdminModule } from '@/lib/admin/types'

export async function requireAdminApiModule(module: AdminModule) {
  const context = await getAdminContext()
  if (!context) {
    return {
      context: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (!canAccessModule(context.tier, module)) {
    return {
      context: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { context, response: null }
}
