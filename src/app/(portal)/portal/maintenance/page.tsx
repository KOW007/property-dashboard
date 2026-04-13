import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getPortalTenant } from '@/lib/portal-auth'
import MaintenanceRequestForm from '@/components/MaintenanceRequestForm'
import PortalMaintenanceContent from '@/components/portal/PortalMaintenanceContent'

export const dynamic = 'force-dynamic'

export default async function PortalMaintenancePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const tenant = await getPortalTenant(supabase, user, 'id')

  const { data: recentLease } = tenant ? await supabase
    .from('leases')
    .select('unit_id')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single() : { data: null }

  const unitId = recentLease?.unit_id

  const { data: openRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date')
    .eq('unit_id', unitId)
    .in('status', ['open', 'in_progress'])
    .order('reported_date', { ascending: false })

  const { data: closedRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date, notes')
    .eq('unit_id', unitId)
    .in('status', ['completed', 'cancelled'])
    .order('reported_date', { ascending: false })
    .limit(20)

  return (
    <PortalMaintenanceContent
      openRequests={openRequests}
      closedRequests={closedRequests}
      formSlot={tenant ? <MaintenanceRequestForm unitId={unitId} tenantId={tenant.id} /> : null}
    />
  )
}
