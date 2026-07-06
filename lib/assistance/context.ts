import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { resolveEffectiveKycStatus } from '@/lib/investor/kyc'
import { formatPrimeFxId } from '@/lib/wallet/primefx-id'

export async function getAssistanceAccountContext(userId: string): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient()

    const [
      { data: profile },
      { data: wallet },
      { data: investments },
      { data: withdrawals },
      { data: deposits },
      { data: referral },
      { count: unreadNotifications },
    ] = await Promise.all([
      supabase
        .from('users')
        .select('full_name, email, investor_tier, kyc_status, is_verified, verification_status')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('wallet_balances')
        .select('available_balance, pending_balance, bonus_balance, total_balance')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('investments')
        .select('id, amount, status, investment_plans(name, weekly_roi)')
        .eq('user_id', userId)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('withdrawal_requests')
        .select('amount_usd, status, requested_at, available_at, method_label')
        .eq('user_id', userId)
        .in('status', ['pending_notice', 'processing', 'pending'])
        .order('requested_at', { ascending: false })
        .limit(3),
      supabase
        .from('transactions')
        .select('type, amount, status, created_at')
        .eq('user_id', userId)
        .eq('type', 'deposit')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('user_referral_stats')
        .select('rank_key, total_member_count, lifetime_commission_usd')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null),
    ])

    const kycStatus = resolveEffectiveKycStatus(profile) ?? 'Pending'
    const primeFxId = formatPrimeFxId(userId)
    const lines: string[] = [
      `Account ID: ${primeFxId}`,
      `Investor tier: ${profile?.investor_tier ?? 'Starter'}`,
      `KYC status: ${kycStatus}`,
    ]

    if (wallet) {
      lines.push(
        `Wallet — available: $${Number(wallet.available_balance ?? 0).toFixed(2)}, pending: $${Number(wallet.pending_balance ?? 0).toFixed(2)}, bonus: $${Number(wallet.bonus_balance ?? 0).toFixed(2)}, total: $${Number(wallet.total_balance ?? 0).toFixed(2)}`
      )
    }

    if (investments?.length) {
      const invLines = investments.map((inv) => {
        const plan = inv.investment_plans as { name?: string; weekly_roi?: number } | null
        const planName = plan?.name ?? 'Investment'
        const weeklyRoi = plan?.weekly_roi ?? 0
        return `  - ${planName}: $${Number(inv.amount).toFixed(2)} (${inv.status}, ${weeklyRoi}% weekly)`
      })
      lines.push(`Active investments (${investments.length}):\n${invLines.join('\n')}`)
    } else {
      lines.push('Active investments: none')
    }

    if (withdrawals?.length) {
      const wLines = withdrawals.map((w) => {
        const eta = w.available_at
          ? `, est. completion: ${new Date(w.available_at as string).toLocaleString('en-US')}`
          : ''
        return `  - $${Number(w.amount_usd).toFixed(2)} via ${w.method_label ?? 'wallet'} — status: ${w.status}${eta}`
      })
      lines.push(`Pending withdrawals:\n${wLines.join('\n')}`)
    }

    if (deposits?.length) {
      const dLines = deposits.map(
        (d) =>
          `  - $${Number(d.amount).toFixed(2)} — ${d.status} (${new Date(d.created_at as string).toLocaleDateString('en-US')})`
      )
      lines.push(`Recent deposits:\n${dLines.join('\n')}`)
    }

    if (referral) {
      lines.push(
        `Referral — rank: ${referral.rank_key ?? 'Member'}, members: ${referral.total_member_count ?? 0}, commission earned: $${Number(referral.lifetime_commission_usd ?? 0).toFixed(2)}`
      )
    }

    if (typeof unreadNotifications === 'number' && unreadNotifications > 0) {
      lines.push(`Unread notifications: ${unreadNotifications}`)
    }

    return lines.join('\n')
  } catch {
    return 'Account context is temporarily unavailable. Provide general platform guidance.'
  }
}
