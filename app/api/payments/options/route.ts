import { NextResponse } from 'next/server'
import { fetchPaymentProviderOptionsServer } from '@/lib/payments/options-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const options = await fetchPaymentProviderOptionsServer()
  return NextResponse.json(options)
}
