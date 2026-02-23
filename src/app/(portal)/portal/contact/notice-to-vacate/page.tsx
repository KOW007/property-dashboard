import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NoticeToVacateForm from '@/components/portal/NoticeToVacateForm'

export const dynamic = 'force-dynamic'

export default async function NoticeToVacatePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, first_name, last_name')
    .eq('email', user.email)
    .single()

  if (!tenant) redirect('/portal/contact')

  const tenantName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim()

  return <NoticeToVacateForm tenantId={tenant.id} tenantName={tenantName} />
}
