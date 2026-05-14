/**
 * POST /api/ach-run-now
 *
 * Admin-triggered manual ACH run. Validates the logged-in Supabase session,
 * then calls /api/ach-cron server-side with the CRON_SECRET so the secret
 * never reaches the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })

  const host     = req.headers.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const cronUrl  = `${protocol}://${host}/api/ach-cron`

  const cronRes  = await fetch(cronUrl, {
    method:  'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  const data = await cronRes.json()
  return NextResponse.json(data, { status: cronRes.status })
}
