/**
 * POST /api/ach-status-poll
 *
 * Polls BOC Bank for the last 5 days by date range, then matches returned
 * files to our ach_batches records by file_name. This works regardless of
 * whether the upload succeeded (has a boc_file_id) or failed on our end —
 * BOC Bank is the source of truth.
 *
 * Called manually from the admin ACH dashboard. Requires an authenticated
 * admin session.
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

  const toDate   = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 5)
  const fromStr = fromDate.toISOString().slice(0, 10)
  const toStr   = toDate.toISOString().slice(0, 10)

  // Load our batch records for the window so we can match by file_name
  const { data: batches, error: batchErr } = await supabase
    .from('ach_batches')
    .select('id, boc_file_id, file_name, run_date, status')
    .gte('run_date', fromStr)
    .order('run_date', { ascending: false })

  if (batchErr) {
    return NextResponse.json({ error: batchErr.message }, { status: 500 })
  }

  // Build a lookup map: file_name → batch row
  const batchByFileName = new Map((batches ?? []).map(b => [b.file_name, b]))

  // Poll BOC Bank for all files in the date range
  let bocFiles
  try {
    const result = await pollAchStatus({ fromDate: fromStr, toDate: toStr })
    bocFiles = result.files
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `BOC Bank poll failed: ${errMsg}` }, { status: 500 })
  }

  if (!bocFiles || bocFiles.length === 0) {
    return NextResponse.json({ ok: true, message: 'No files found at BOC Bank for this period', polled: [] })
  }

  const polled: Array<{
    runDate:    string
    fileId:     string
    fileName:   string
    fileStatus: string
    itemCount:  number
    error?:     string
  }> = []

  for (const file of bocFiles) {
    const fileName = file.fileName ?? ''
    const batch    = batchByFileName.get(fileName)

    if (!batch) {
      // BOC Bank has a file we don't have a local record for — skip
      polled.push({ runDate: '?', fileId: file.fileId, fileName, fileStatus: file.status, itemCount: file.items.length, error: 'No matching local batch' })
      continue
    }

    await supabase
      .from('ach_batches')
      .update({
        boc_file_id:      file.fileId,
        boc_file_status:  file.status,
        boc_references:   file.items,
        status:           batch.status === 'failed' ? 'uploaded' : batch.status,
        last_polled_at:   new Date().toISOString(),
      })
      .eq('id', batch.id)

    polled.push({
      runDate:    batch.run_date,
      fileId:     file.fileId,
      fileName,
      fileStatus: file.status,
      itemCount:  file.items.length,
    })
  }

  return NextResponse.json({ ok: true, polled })
}
