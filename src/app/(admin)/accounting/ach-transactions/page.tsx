import { createSupabaseServer } from '@/lib/supabase-server'
import AchTransactionsClient from '@/components/AchTransactionsClient'

export const dynamic = 'force-dynamic'

export default async function AchTransactionsPage() {
  const supabase = await createSupabaseServer()

  const [{ data: transactions }, { data: batches }] = await Promise.all([
    supabase
      .from('ach_transactions')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(200),
    supabase
      .from('ach_batches')
      .select('id, run_date, file_name, entry_count, total_cents, status, boc_file_id, boc_file_status, last_polled_at, boc_references')
      .not('boc_file_id', 'is', null)
      .order('run_date', { ascending: false })
      .limit(10),
  ])

  return (
    <AchTransactionsClient
      transactions={transactions ?? []}
      batches={batches ?? []}
    />
  )
}
