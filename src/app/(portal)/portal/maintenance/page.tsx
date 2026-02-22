import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MaintenanceRequestForm from '@/components/MaintenanceRequestForm'
import PortalMaintenanceContent from '@/components/portal/PortalMaintenanceContent'

export const dynamic = 'force-dynamic'

export default async function PortalMaintenancePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, unit_id')
    .eq('email', user.email)
    .single()

  const { data: openRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date')
    .eq('unit_id', tenant?.unit_id)
    .in('status', ['open', 'in_progress'])
    .order('reported_date', { ascending: false })

  const { data: closedRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date, notes')
    .eq('unit_id', tenant?.unit_id)
    .in('status', ['completed', 'cancelled'])
    .order('reported_date', { ascending: false })
    .limit(20)

  return (
    <PortalMaintenanceContent
      openRequests={openRequests}
      closedRequests={closedRequests}
      formSlot={tenant ? <MaintenanceRequestForm unitId={tenant.unit_id} tenantId={tenant.id} /> : null}
    />
  )
}
