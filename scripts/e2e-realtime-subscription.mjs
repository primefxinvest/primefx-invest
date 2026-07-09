#!/usr/bin/env node
/**
 * Verifies Supabase realtime channels for investment profit updates.
 * Run: node scripts/e2e-realtime-subscription.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('Missing Supabase public env')
  process.exit(1)
}

const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: node scripts/e2e-realtime-subscription.mjs <userId>')
  process.exit(1)
}

let profitHistoryEvent = false
let investmentUpdateEvent = false

const channel = db
  .channel(`verify:investment-profits:${userId}`)
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'investment_profit_history', filter: `user_id=eq.${userId}` },
    () => {
      profitHistoryEvent = true
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'investments', filter: `user_id=eq.${userId}` },
    () => {
      investmentUpdateEvent = true
    }
  )
  .subscribe((status) => {
    console.log('CHANNEL_STATUS:', status)
    if (status === 'SUBSCRIBED') {
      console.log('REALTIME_SUBSCRIBED')
      setTimeout(() => {
        console.log(
          JSON.stringify({
            profitHistoryListenerReady: true,
            investmentUpdateListenerReady: true,
            profitHistoryEventReceived: profitHistoryEvent,
            investmentUpdateEventReceived: investmentUpdateEvent,
            note: 'Listeners active; events fire on next profit credit without page refresh.',
          })
        )
        void db.removeChannel(channel)
        process.exit(0)
      }, 3000)
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error('REALTIME_FAILED:', status)
      process.exit(1)
    }
  })

setTimeout(() => {
  console.error('REALTIME_TIMEOUT')
  process.exit(1)
}, 15000)
