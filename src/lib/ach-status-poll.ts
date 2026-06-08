import type { SupabaseClient } from '@supabase/supabase-js'
import { pollAchStatus } from '@/lib/boc-bank'

export interface PollResult {
  runDate:    string
  fileId:     string
  fileName:   string
  fileStatus: string
  itemCount:  number
  error?:     string
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
