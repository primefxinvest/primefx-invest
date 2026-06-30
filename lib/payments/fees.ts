import 'server-only'

export {
  calculateP2pTransferFee,
  calculateWithdrawalFee,
  getWithdrawalAvailableDate,
  roundMoney,
} from '@/lib/fees/constants'

export async function recordPlatformFee(input: {
  userId: string
  feeType: 'p2p_transfer' | 'withdrawal'
  grossAmount: number
  feeAmount: number
  referenceId: string
}) {
  const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-server')
  const db = createAdminSupabaseClient()
  if (!db) return

  await db.from('platform_fee_ledger').insert({
    user_id: input.userId,
    fee_type: input.feeType,
    gross_amount: input.grossAmount,
    fee_amount: input.feeAmount,
    reference_id: input.referenceId,
  })
}
