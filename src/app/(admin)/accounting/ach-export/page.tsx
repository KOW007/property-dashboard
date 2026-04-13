import { createSupabaseServer } from '@/lib/supabase-server'
import AchExportClient from '@/components/AchExportClient'

export const dynamic = 'force-dynamic'

export default async function AchExportPage() {
  const supabase = await createSupabaseServer()

  // Pull recent receipts — admin will select which ones to batch
  const { data: receipts } = await supabase
    .from('receivables_view')
    .select('id, date, payer, amount, reference, property_name, unit_number')
    .eq('type', 'receipt')
    .order('date', { ascending: false })
    .limit(100)

  return <AchExportClient receipts={receipts ?? []} />
}
