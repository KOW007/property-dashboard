/**
 * POST /api/ach-status-poll
 *
 * Polls BOC Bank for current ACH status on all batches from the last 5 calendar
 * days. Overwrites boc_references with full item status data and updates
 * boc_file_status / last_polled_at on ach_batches.
 *
 * Called manually from the admin ACH dashboard. Requires an authenticated
 * admin session.
 *
 * Run this once in Supabase SQL editor before first use:
 *   ALTER TABLE ach_batches
 *     ADD COLUMN IF NOT EXISTS boc_file_status text,
 *     ADD COLUMN IF NOT EXISTS last_polled_at  timestamptz;
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'
import { pollAchStatus } from '@/lib/boc-bank'

export const dynamic = 'force-dynamic'

function getServiceSupabase() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('Supabase service role not configured')
  return createClient(url, secret, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  void req

  const supabaseAuth = await createSupabaseServer()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  const since = new Date()
  since.setDate(since.getDate() - 5)
  const sinceStr = since.toISOString().slice(0, 10)

  // Batches with a BOC file ID — poll by file ID
  const { data: uploadedBatches, error: batchErr } = await supabase
    .from('ach_batches')
    .select('id, boc_file_id, file_name, run_date')
    .not('boc_file_id', 'is', null)
    .neq('status', 'failed')
    .gte('run_date', sinceStr)
    .order('run_date', { ascending: false })

  if (batchErr) {
    return NextResponse.json({ error: batchErr.message }, { status: 500 })
  }

  // Failed batches with no BOC file ID but a file_name — poll by filename
  // (covers cases where upload returned an error but BOC Bank still received the file)
  const { data: failedBatches } = await supabase
    .from('ach_batches')
    .select('id, boc_file_id, file_name, run_date')
    .is('boc_file_id', null)
    .eq('status', 'failed')
    .not('file_name', 'is', null)
    .gte('run_date', sinceStr)
    .order('run_date', { ascending: false })

  const batches = [...(uploadedBatches ?? []), ...(failedBatches ?? [])]

  if (batches.length === 0) {
    return NextResponse.json({ ok: true, message: 'No recent batches to poll', polled: [] })
  }

  const polled: Array<{
    runDate:    string
    fileId:     string
    fileStatus: string
    itemCount:  number
    error?:     string
  }> = []

  for (const batch of batches) {
    try {
      const query = batch.boc_file_id
        ? { fileId: batch.boc_file_id }
        : { fileName: batch.file_name as string }

      const { files } = await pollAchStatus(query)
      const file = files[0]

      if (!file) {
        polled.push({ runDate: batch.run_date, fileId: batch.boc_file_id ?? batch.file_name, fileStatus: 'not_found', itemCount: 0, error: 'Not found at BOC Bank' })
        continue
      }

      await supabase
        .from('ach_batches')
        .update({
          boc_file_id:     file.fileId,
          boc_file_status: file.status,
          boc_references:  file.items,
          status:          'uploaded',
          last_polled_at:  new Date().toISOString(),
        })
        .eq('id', batch.id)

      polled.push({
        runDate:    batch.run_date,
        fileId:     file.fileId,
        fileStatus: file.status,
        itemCount:  file.items.length,
      })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      polled.push({ runDate: batch.run_date, fileId: batch.boc_file_id ?? batch.file_name ?? '', fileStatus: 'error', itemCount: 0, error: errMsg })
    }
  }

  return NextResponse.json({ ok: true, polled })
}
