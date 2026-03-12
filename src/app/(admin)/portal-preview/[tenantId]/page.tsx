import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PortalHomeContent from '@/components/portal/PortalHomeContent'
import PortalPaymentsContent from '@/components/portal/PortalPaymentsContent'
import PortalMaintenanceContent from '@/components/portal/PortalMaintenanceContent'
import PortalContactContent from '@/components/portal/PortalContactContent'
import PortalPropertyContent from '@/components/portal/PortalPropertyContent'
import PortalAccountContent from '@/components/portal/PortalAccountContent'

export const dynamic = 'force-dynamic'

const TAB_LABELS = ['Home', 'Payments', 'Maintenance', 'Contact Us', 'Property Details', 'Account Profile']

export default async function PortalPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { tenantId } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'Home'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (!tenant) notFound()

  // Use rent_roll — already has address/unit info joined correctly
  const { data: rentRows } = await supabase
    .from('rent_roll')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(1)
  const rentRow = rentRows?.[0] ?? null

  // Get unit_id from lease for downstream queries
  const { data: leaseRows } = await supabase
    .from('leases')
    .select('unit_id')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
  const recentLease = leaseRows?.[0] ?? null
  const unitId = recentLease?.unit_id ?? null

  const unit = rentRow ? { unit_number: rentRow.unit_number } : null
  const property = rentRow ? {
    name: rentRow.property_name,
    address: rentRow.address,
    city: rentRow.city,
    state: rentRow.state,
    zip: rentRow.zip,
  } : null
  const propertyAddress = property
    ? `${property.address}, Unit ${unit?.unit_number}, ${property.city}, ${property.state} ${property.zip}`
    : ''
  const tenantName = `${tenant.first_name} ${tenant.last_name}`

  // --- Fetch data for all tabs upfront ---

  // Home + shared — use tenant_id for lease, unit_id for unit-based data
  const { data: lease } = await supabase
    .from('leases')
    .select('monthly_rent, start_date, end_date')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: charges } = unitId ? await supabase
    .from('receivables')
    .select('description, amount, date, type')
    .eq('unit_id', unitId)
    .eq('type', 'charge')
    .order('date', { ascending: true })
    .limit(10) : { data: null }

  const { data: openRequests } = unitId ? await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date')
    .eq('unit_id', unitId)
    .in('status', ['open', 'in_progress'])
    .order('reported_date', { ascending: false }) : { data: null }

  // Payments
  const { data: paymentHistory } = unitId ? await supabase
    .from('receivables')
    .select('date, description, amount, type, reference')
    .eq('unit_id', unitId)
    .order('date', { ascending: false })
    .limit(50) : { data: null }

  // Maintenance
  const { data: closedRequests } = unitId ? await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date, notes')
    .eq('unit_id', unitId)
    .in('status', ['completed', 'cancelled'])
    .order('reported_date', { ascending: false })
    .limit(20) : { data: null }

  // Property — leases by tenant_id, documents by unit_id
  const { data: leases } = await supabase
    .from('leases')
    .select('start_date, end_date, monthly_rent, document_url')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(5)

  const { data: documents } = unitId ? await supabase
    .from('documents')
    .select('id, name, url, created_at')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false }) : { data: null }

  return (
    <div>
      {/* Temporary debug — remove once address is working */}
      <pre className="bg-black text-green-400 text-xs p-3 rounded mb-4 overflow-x-auto">
        {JSON.stringify({ rentRow, unitId, property, unit }, null, 2)}
      </pre>

      {/* Admin Preview Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800 text-sm">
          <span className="text-lg">👁</span>
          <span>
            <strong>Admin Preview:</strong> Viewing portal as <strong>{tenantName}</strong>
            {propertyAddress && <span className="text-amber-600"> · {propertyAddress}</span>}
          </span>
        </div>
        <Link href="/portal-preview" className="text-xs text-amber-700 hover:text-amber-900 font-medium underline">
          ← Back to tenant list
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg shadow px-3 py-2 overflow-x-auto">
        {TAB_LABELS.map((label) => (
          <Link
            key={label}
            href={`/portal-preview/${tenantId}?tab=${encodeURIComponent(label)}`}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === label
                ? 'bg-[#b22625] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tab Content — uses shared portal components */}
      <div>
        {activeTab === 'Home' && (
          <PortalHomeContent
            charges={charges}
            lease={lease}
            openRequests={openRequests}
            isPreview
          />
        )}
        {activeTab === 'Payments' && (
          <PortalPaymentsContent
            history={paymentHistory}
            isPreview
          />
        )}
        {activeTab === 'Maintenance' && (
          <PortalMaintenanceContent
            openRequests={openRequests}
            closedRequests={closedRequests}
            isPreview
          />
        )}
        {activeTab === 'Contact Us' && (
          <PortalContactContent isPreview />
        )}
        {activeTab === 'Property Details' && (
          <PortalPropertyContent
            property={property}
            unit={unit}
            leases={leases}
            documents={documents}
            isAdmin
          />
        )}
        {activeTab === 'Account Profile' && (
          <PortalAccountContent
            tenant={tenant}
            userEmail={tenant.email ?? ''}
            isPreview
          />
        )}
      </div>
    </div>
  )
}
