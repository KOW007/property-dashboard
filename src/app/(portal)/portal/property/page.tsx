import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getPortalTenant } from '@/lib/portal-auth'
import PortalPropertyContent from '@/components/portal/PortalPropertyContent'

export const dynamic = 'force-dynamic'

export default async function PortalPropertyPage() {
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
    .maybeSingle() : { data: null }

  const unitId = recentLease?.unit_id ?? null

  // Fetch unit + property directly — works regardless of lease status
  const { data: unitRow } = unitId ? await supabase
    .from('units')
    .select('unit_number, properties(name, address, city, state, zip)')
    .eq('id', unitId)
    .maybeSingle() : { data: null }

  const unit = unitRow ? { unit_number: unitRow.unit_number } : null
  const prop = unitRow?.properties as any
  const property = prop ? {
    name:    prop.name,
    address: prop.address,
    city:    prop.city,
    state:   prop.state,
    zip:     prop.zip,
  } : null

  const { data: leases } = (unitId && tenant) ? await supabase
    .from('leases')
    .select('start_date, end_date, monthly_rent, document_url')
    .eq('unit_id', unitId)
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(5) : { data: null }

  const { data: documents } = unitId ? await supabase
    .from('documents')
    .select('id, name, url, created_at')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false }) : { data: null }

  return (
    <PortalPropertyContent
      property={property}
      unit={unit}
      leases={leases}
      documents={documents}
    />
  )
}
