import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getPortalTenant } from '@/lib/portal-auth'
import PortalHomeContent from '@/components/portal/PortalHomeContent'

export const dynamic = 'force-dynamic'

export default async function PortalHomePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const tenant = await getPortalTenant(supabase, user, 'id, first_name')

  if (!tenant) {
    return (
      <div className="text-center py-20 text-gray-500">
        No tenant record found for this account. Please contact your property manager.
      </div>
    )
  }

  // Get unit_id + lease info from most recent lease
  const { data: lease } = await supabase
    .from('leases')
    .select('unit_id, monthly_rent, end_date, start_date')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  const unitId = lease?.unit_id

  const { data: charges } = await supabase
    .from('receivables')
    .select('description, amount, date, type')
    .eq('unit_id', unitId)
    .eq('type', 'charge')
    .order('date', { ascending: true })
    .limit(10)

  const { data: openRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, status, reported_date')
    .eq('unit_id', unitId)
    .in('status', ['open', 'in_progress'])
    .order('reported_date', { ascending: false })

  return (
    <PortalHomeContent
      charges={charges}
      lease={lease}
      openRequests={openRequests}
    />
  )
}
