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
    .select('id, unit_id')
    .eq('email', user.email)
    .single()

  const { data: unit } = tenant ? await supabase
    .from('units')
    .select('unit_number, property_id, properties(name, address, city, state, zip)')
    .eq('id', tenant.unit_id)
    .single() : { data: null }

  const { data: leases } = tenant ? await supabase
    .from('leases')
    .select('start_date, end_date, monthly_rent')
    .eq('unit_id', tenant.unit_id)
    .order('end_date', { ascending: false })
    .limit(5) : { data: null }

  const { data: documents } = tenant ? await supabase
    .from('documents')
    .select('id, name, url, created_at')
    .eq('unit_id', tenant.unit_id)
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
