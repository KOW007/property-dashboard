import { createSupabaseServer } from '@/lib/supabase-server'
import AchTransactionsClient from '@/components/AchTransactionsClient'

export const dynamic = 'force-dynamic'

export default async function AchTransactionsPage() {
  const supabase = await createSupabaseServer()

  const { data: transactions } = await supabase
    .from('ach_transactions')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(200)

  return <AchTransactionsClient transactions={transactions ?? []} />
}
