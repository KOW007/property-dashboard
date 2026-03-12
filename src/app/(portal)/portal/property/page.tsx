import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PortalPropertyContent from '@/components/portal/PortalPropertyContent'

export const dynamic = 'force-dynamic'

export default async function PortalPropertyPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('email', user.email)
    .single()

  const { data: recentLease } = tenant ? await supabase
    .from('leases')
    .select('unit_id')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single() : { data: null }

  const unitId = recentLease?.unit_id ?? null

  const { data: unit } = unitId ? await supabase
    .from('units')
    .select('unit_number, property_id, properties(name, address, city, state, zip)')
    .eq('id', unitId)
    .single() : { data: null }

  const { data: leases } = unitId ? await supabase
    .from('leases')
    .select('start_date, end_date, monthly_rent, document_url')
    .eq('unit_id', unitId)
    .order('end_date', { ascending: false })
    .limit(5) : { data: null }

  const { data: documents } = unitId ? await supabase
    .from('documents')
    .select('id, name, url, created_at')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false }) : { data: null }

  const property = unit?.properties as any

  return (
    <PortalPropertyContent
      property={property}
      unit={unit}
      leases={leases}
      documents={documents}
    />
  )
}
