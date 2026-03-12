import { createSupabaseServer } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import MaintenanceDetailForm from '@/components/MaintenanceDetailForm'

export const dynamic = 'force-dynamic'

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: request } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!request) notFound()

  // Get unit + property info
  const { data: unit } = request.unit_id ? await supabase
    .from('units')
    .select('unit_number, property_id, properties(name, address, city, state, zip)')
    .eq('id', request.unit_id)
    .single() : { data: null }

  // Get tenant info
  const { data: tenant } = request.tenant_id ? await supabase
    .from('tenants')
    .select('first_name, last_name, email, phone')
    .eq('id', request.tenant_id)
    .single() : { data: null }

  const property = unit ? (unit.properties as any) : null

  return (
    <MaintenanceDetailForm
      request={request}
      unit={unit ? { unit_number: unit.unit_number } : null}
      property={property}
      tenant={tenant}
    />
  )
}
