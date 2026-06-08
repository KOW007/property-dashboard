import type { SupabaseClient } from '@supabase/supabase-js'
import { pollAchStatus, type BocStatusItem } from '@/lib/boc-bank'
import { getReturnCode } from '@/lib/nacha-returns'

export interface PollResult {
  runDate:    string
  fileId:     string
  fileName:   string
  fileStatus: string
  itemCount:  number
  error?:     string
}

// Backfill ach_transactions for any terminal events the webhook may have missed.
// Uses bankReference as a stable dedup key so re-polling is idempotent.
async function backfillTransactions(supabase: SupabaseClient, items: BocStatusItem[]) {
  for (const item of items) {
    for (const event of item.events ?? []) {
      if (event.eventType === 'Settled') {
        await supabase.from('ach_transactions').upsert({
          event_id:       `poll-${item.bankReference}-settled`,
          event_type:     'ach.settlement',
          trace_number:   item.customerTraceNumber,
          amount_cents:   Math.round(item.amount * 100),
          individual_id:  item.individualId ?? null,
          individual_name: item.individualName,
          effective_date: item.effectiveDate,
          received_at:    event.eventDate,
        }, { onConflict: 'event_id', ignoreDuplicates: true })
      }

      if (event.eventType === 'Returned') {
        const returnCode = event.eventData?.returnCode ?? null
        const returnInfo = returnCode ? getReturnCode(returnCode) : null
        await supabase.from('ach_transactions').upsert({
          event_id:           `poll-${item.bankReference}-returned`,
          event_type:         'ach.return',
          trace_number:       item.customerTraceNumber,
          return_code:        returnCode,
          return_description: returnInfo?.description ?? event.eventData?.returnDescription ?? null,
          return_action:      returnInfo?.action ?? null,
          return_severity:    returnInfo?.severity ?? null,
          amount_cents:       Math.round(item.amount * 100),
          individual_id:      item.individualId ?? null,
          individual_name:    item.individualName,
          effective_date:     item.effectiveDate,
          received_at:        event.eventDate,
        }, { onConflict: 'event_id', ignoreDuplicates: true })
      }

      if (event.eventType === 'NOCApplied') {
        await supabase.from('ach_transactions').upsert({
          event_id:        `poll-${item.bankReference}-noc`,
          event_type:      'ach.noc',
          trace_number:    item.customerTraceNumber,
          amount_cents:    Math.round(item.amount * 100),
          individual_id:   item.individualId ?? null,
          individual_name: item.individualName,
          effective_date:  item.effectiveDate,
          received_at:     event.eventDate,
        }, { onConflict: 'event_id', ignoreDuplicates: true })
      }
    }
  }
}

export async function runAchStatusPoll(
  supabase: SupabaseClient,
  { days = 7 }: { days?: number } = {}
): Promise<{ ok: boolean; message?: string; polled: PollResult[] }> {
  const toDate   = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  const fromStr = fromDate.toISOString().slice(0, 10)
  const toStr   = toDate.toISOString().slice(0, 10)

  const { data: batches, error: batchErr } = await supabase
    .from('ach_batches')
    .select('id, boc_file_id, file_name, run_date, status')
    .gte('run_date', fromStr)
    .order('run_date', { ascending: false })

  if (batchErr) throw new Error(batchErr.message)

  const batchByFileName = new Map((batches ?? []).map(b => [b.file_name, b]))

  let bocFiles
  try {
    const result = await pollAchStatus({ fromDate: fromStr, toDate: toStr })
    bocFiles = result.files
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    throw new Error(`BOC Bank poll failed: ${errMsg}`)
  }

  if (!bocFiles || bocFiles.length === 0) {
    return { ok: true, message: 'No files found at BOC Bank for this period', polled: [] }
  }

  const polled: PollResult[] = []

  for (const file of bocFiles) {
    const fileName = file.fileName ?? ''
    const batch    = batchByFileName.get(fileName)

    if (!batch) {
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

    await backfillTransactions(supabase, file.items)

    polled.push({
      runDate:    batch.run_date,
      fileId:     file.fileId,
      fileName,
      fileStatus: file.status,
      itemCount:  file.items.length,
    })
  }

  return { ok: true, polled }
}
