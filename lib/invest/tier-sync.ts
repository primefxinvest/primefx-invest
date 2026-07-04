import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { INVESTOR_TIER_ORDER, normalizeInvestorTier } from '@/lib/investor/tiers'
import { planTierOrder, normalizePlanTier, type PlanTierKey } from '@/lib/invest/upgrade'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

function tierRank(key: PlanTierKey) {
  return INVESTOR_TIER_ORDER.indexOf(key)
}

export function planNameToTierKey(planName: string): PlanTierKey {
  const exact = planTierOrder.find((entry) => entry.planName === planName)
  if (exact) return exact.key
  return normalizePlanTier(planName)
}

export function tierKeyToInvestorLabel(key: PlanTierKey): string {
  const entry = planTierOrder.find((plan) => plan.key === key)
  return entry?.shortName ?? 'Starter'
}

export function highestPlanTier(planNames: string[]): PlanTierKey {
  let highest: PlanTierKey = 'starter'
  for (const name of planNames) {
    const key = planNameToTierKey(name)
    if (tierRank(key) > tierRank(highest)) {
      highest = key
    }
  }
  return highest
}

/** Raise investor_tier to match the user's highest active investment plan (never downgrade). */
export async function syncInvestorTierFromActivePlans(
  userId: string,
  db: SupabaseClient
): Promise<{ upgraded: boolean; investorTier?: string }> {
  const { data: rows, error: investmentsError } = await db
    .from('investments')
    .select('investment_plans(name)')
    .eq('user_id', userId)
    .ilike('status', 'active')

  if (investmentsError) {
    throw new Error(investmentsError.message)
  }

  const planNames = (rows ?? [])
    .map((row) => {
      const plan = row.investment_plans as { name?: string } | null
      return plan?.name?.trim() ?? ''
    })
    .filter(Boolean)

  if (!planNames.length) {
    return { upgraded: false }
  }

  const targetKey = highestPlanTier(planNames)
  const targetLabel = tierKeyToInvestorLabel(targetKey)

  const { data: user, error: userError } = await db
    .from('users')
    .select('investor_tier')
    .eq('id', userId)
    .maybeSingle()

  if (userError) {
    throw new Error(userError.message)
  }

  const currentKey = normalizeInvestorTier(user?.investor_tier as string | undefined)
  if (tierRank(targetKey) <= tierRank(currentKey)) {
    return { upgraded: false }
  }

  const { error: updateError } = await db
    .from('users')
    .update({
      investor_tier: targetLabel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  const admin = createAdminSupabaseClient()
  if (admin) {
    const { data: authData } = await admin.auth.admin.getUserById(userId)
    if (authData?.user) {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(authData.user.user_metadata ?? {}),
          investor_tier: targetLabel,
        },
      })
    }
  }

  return { upgraded: true, investorTier: targetLabel }
}
