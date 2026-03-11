import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MoveInsOutsPage() {
  const supabase = await createSupabaseServer()

  // Fetch future tenants (Move Ins)
  const { data: futureTenants } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, email, move_in_date, balance, utilities, status')
    .eq('status', 'Future')

  // Fetch move-out tenants (Notice or Past)
  const { data: moveOutTenants } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, move_out_date, status')
    .in('status', ['Notice-Unrented', 'Notice-Rented', 'Past'])
    .order('move_out_date', { ascending: true })

  // Fetch leases for future tenants to get lease_status, unit_id, move_in_date
  const futureTenantIds = (futureTenants || []).map(t => t.id)
  const moveOutTenantIds = (moveOutTenants || []).map(t => t.id)
  const allTenantIds = [...futureTenantIds, ...moveOutTenantIds]

  const { data: leases } = allTenantIds.length > 0
    ? await supabase
        .from('leases')
        .select('id, tenant_id, unit_id, lease_status, move_in_date')
        .in('tenant_id', allTenantIds)
        .order('end_date', { ascending: false })
    : { data: [] }

  // Build a map of tenant_id -> latest lease
  const leaseMap = new Map<string, any>()
  for (const lease of leases || []) {
    if (!leaseMap.has(lease.tenant_id)) {
      leaseMap.set(lease.tenant_id, lease)
    }
  }

  // Collect all unit IDs from leases
  const unitIds = [...new Set((leases || []).map(l => l.unit_id).filter(Boolean))]

  const { data: units } = unitIds.length > 0
    ? await supabase
        .from('units')
        .select('id, unit_number, property_id, properties(name)')
        .in('id', unitIds)
    : { data: [] }

  const unitMap = new Map<string, any>()
  for (const unit of units || []) {
    unitMap.set(unit.id, unit)
  }

  // Check portal status — get all auth users and build a set of emails
  const portalEmails = new Set<string>()
  const futureEmails = (futureTenants || []).map(t => t.email).filter(Boolean)
  if (futureEmails.length > 0) {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (authData?.users) {
      for (const user of authData.users) {
        if (user.email) portalEmails.add(user.email.toLowerCase())
      }
    }
  }

  // Helper to get unit/property display
  function getUnitDisplay(tenantId: string) {
    const lease = leaseMap.get(tenantId)
    if (!lease?.unit_id) return '—'
    const unit = unitMap.get(lease.unit_id)
    if (!unit) return '—'
    const propName = (unit.properties as any)?.name || 'Unknown'
    return `${propName} - Unit ${unit.unit_number}`
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Move Ins / Move Outs</h1>

      {/* Move Ins Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Move Ins
          <span className="ml-2 text-sm font-normal text-gray-500">({(futureTenants || []).length})</span>
        </h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Future Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property - Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Portal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilities</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Move In Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(futureTenants || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No upcoming move-ins</td>
                </tr>
              ) : (
                (futureTenants || []).map(tenant => {
                  const lease = leaseMap.get(tenant.id)
                  const leaseStatus = lease?.lease_status || 'Draft'
                  const hasPortal = tenant.email && portalEmails.has(tenant.email.toLowerCase())
                  const moveInDate = tenant.move_in_date || lease?.move_in_date

                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/tenants/${tenant.id}`} className="text-[#b22625] hover:underline font-medium">
                          {tenant.first_name} {tenant.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{getUnitDisplay(tenant.id)}</td>
                      <td className="px-4 py-3">
                        <LeaseStatusBadge status={leaseStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <PortalStatusBadge active={!!hasPortal} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {tenant.balance != null ? `$${Number(tenant.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{tenant.utilities || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {moveInDate ? new Date(moveInDate + 'T00:00').toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move Outs Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Move Outs
          <span className="ml-2 text-sm font-normal text-gray-500">({(moveOutTenants || []).length})</span>
        </h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property - Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Move Out Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(moveOutTenants || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No upcoming move-outs</td>
                </tr>
              ) : (
                (moveOutTenants || []).map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/tenants/${tenant.id}`} className="text-[#b22625] hover:underline font-medium">
                        {tenant.first_name} {tenant.last_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{getUnitDisplay(tenant.id)}</td>
                    <td className="px-4 py-3">
                      <MoveOutStatusBadge status={tenant.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {tenant.move_out_date ? new Date(tenant.move_out_date + 'T00:00').toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LeaseStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Out for Signing': 'bg-yellow-100 text-yellow-800',
    'Fully Executed': 'bg-green-100 text-green-800',
  }
  const colorClass = colors[status] || 'bg-gray-100 text-gray-700'
  return <span className={`${colorClass} px-2 py-1 rounded text-xs font-medium`}>{status}</span>
}

function PortalStatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Active</span>
    : <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-medium">Not Active</span>
}

function MoveOutStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Notice-Unrented': 'bg-yellow-100 text-yellow-800',
    'Notice-Rented': 'bg-orange-100 text-orange-800',
    'Past': 'bg-gray-100 text-gray-600',
  }
  const colorClass = colors[status] || 'bg-gray-100 text-gray-700'
  const label = status === 'Notice-Unrented' ? 'Notice (Unrented)'
    : status === 'Notice-Rented' ? 'Notice (Rented)'
    : status
  return <span className={`${colorClass} px-2 py-1 rounded text-xs font-medium`}>{label}</span>
}
