/**
 * GET|POST /api/ach-status-cron
 *
 * Daily ACH status poll — called by Vercel Cron (see vercel.json).
 * Runs every day at 5 PM CST (23:00 UTC) to catch end-of-day settlements.
 *
 * Security: requires Authorization: Bearer <CRON_SECRET> header.
 * Vercel automatically sends this header when CRON_SECRET env var is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runAchStatusPoll } from '@/lib/ach-status-poll'

export const dynamic = 'force-dynamic'

function getServiceSupabase() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('Supabase service role not configured')
  return createClient(url, secret, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  try {
    const result = await runAchStatusPoll(supabase, { days: 7 })
    return NextResponse.json(result)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

// Vercel Cron sends GET requests
export const GET = POST
