import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TenantActivitySection from '@/components/TenantActivitySection'
import TenantPortalActions from '@/components/TenantPortalActions'
import TenantContactSection from '@/components/TenantContactSection'
import TenantLeaseSection from '@/components/TenantLeaseSection'
import TenantScreeningSection from '@/components/TenantScreeningSection'
import TenantEmergencyContactSection from '@/components/TenantEmergencyContactSection'
import TenantStatusSection from '@/components/TenantStatusSection'

export const dynamic = 'force-dynamic'

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer()
  const { id } = await params

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  // Fetch lease
  const { data: lease } = await supabase
    .from('leases')
    .select('*')
    .eq('tenant_id', id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  // Fetch unit + property info via lease
  const unitId = lease?.unit_id
  const { data: unit } = unitId ? await supabase
    .from('units')
    .select('unit_number, property_id, properties(name)')
    .eq('id', unitId)
    .single() : { data: null }

  const property_name = (unit?.properties as any)?.name
  const unit_number = unit?.unit_number

  // Fetch all units for the unit picker in lease edit
  const { data: allUnits } = await supabase
    .from('units')
    .select('id, unit_number, property_id, properties(name)')
    .order('unit_number')

  // Fetch units that currently have an active lease (excluding this tenant's own lease)
  const today_iso = new Date().toISOString().split('T')[0]
  const { data: activeLeases } = await supabase
    .from('leases')
    .select('unit_id')
    .gte('end_date', today_iso)
    .neq('id', lease?.id ?? '')
  const occupiedUnitIds = (activeLeases ?? []).map(l => l.unit_id).filter(Boolean) as string[]

  // Fetch payment history
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('lease_id', lease?.id)
    .order('for_month', { ascending: false })
    .limit(24)

  // Fetch maintenance requests
  const { data: maintenance } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('tenant_id', id)
    .order('reported_date', { ascending: false })

  // Fetch activities
  const { data: activities } = await supabase
    .from('tenant_activities')
    .select('*')
    .eq('tenant_id', id)
    .order('date', { ascending: false })

  const fmt = (val: string | null | undefined) => {
    if (!val) return '—'
    const d = val.includes('T') ? new Date(val) : new Date(val + 'T00:00')
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  const fmtMoney = (val: number | null | undefined) =>
    val != null ? `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'

  const statusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-700'
    if (status.toLowerCase() === 'current') return 'bg-green-100 text-green-800'
    if (status.toLowerCase().includes('notice')) return 'bg-yellow-100 text-yellow-800'
    if (status.toLowerCase() === 'past') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-700'
  }

  const priorityColor = (priority: string | null) => {
    if (!priority) return 'bg-gray-100 text-gray-700'
    if (priority.toLowerCase() === 'high' || priority.toLowerCase() === 'urgent') return 'bg-red-100 text-red-800'
    if (priority.toLowerCase() === 'medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const maintenanceStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-700'
    if (status.toLowerCase() === 'open') return 'bg-red-100 text-red-800'
    if (status.toLowerCase() === 'in progress') return 'bg-yellow-100 text-yellow-800'
    if (status.toLowerCase() === 'completed') return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-700'
  }

  const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim()

  // Payment stats
  const totalPaid = payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0
  const lateCount = payments?.filter(p => p.status === 'late' || p.late_fee > 0).length || 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <div className="mb-4">
        <Link href="/rent-roll" className="text-sm text-[#b22625] hover:underline">
          ← Back to Rent Roll
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-gray-500 mt-1">{property_name} · Unit {unit_number}</p>
          {tenant.email && (
            <div className="mt-3">
              <TenantPortalActions email={tenant.email} tenantName={fullName} />
            </div>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(tenant.status)}`}>
          {tenant.status || 'Current'}
        </span>
      </div>

      {/* Grid: Tenant Info + Lease Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Contact Info */}
        <TenantContactSection
          tenantId={id}
          email={tenant.email}
          phone={tenant.phone}
          license_plates={tenant.license_plates}
          pets={tenant.pets}
          is_primary_tenant={tenant.is_primary_tenant}
        />

        {/* Lease Info */}
        <TenantLeaseSection
          leaseId={lease?.id ?? null}
          unitId={unitId ?? null}
          allUnits={(allUnits ?? []).map(u => ({ id: u.id, unit_number: u.unit_number, property_name: (u.properties as any)?.name ?? '' }))}
          occupiedUnitIds={occupiedUnitIds}
          monthly_rent={lease?.monthly_rent ?? null}
          security_deposit={lease?.security_deposit ?? null}
          start_date={lease?.start_date ?? null}
          end_date={lease?.end_date ?? null}
          move_in_date={lease?.move_in_date ?? null}
          last_lease_renewal={lease?.last_lease_renewal ?? null}
          next_rent_increase_date={lease?.next_rent_increase_date ?? null}
          tenant_tags={lease?.tenant_tags ?? null}
          lease_status={lease?.lease_status ?? null}
          notes={lease?.notes ?? null}
        />
      </div>

      {/* Screening */}
      <TenantScreeningSection
        tenantId={id}
        birthdate={tenant.birthdate}
        ssn={tenant.ssn}
        drivers_license={tenant.drivers_license}
        drivers_license_state={tenant.drivers_license_state}
        credit_report_date={tenant.credit_report_date}
        credit_score={tenant.credit_score}
      />

      {/* Emergency Contact */}
      <TenantEmergencyContactSection
        tenantId={id}
        emergency_contact_name={tenant.emergency_contact_name}
        emergency_contact_phone={tenant.emergency_contact_phone}
        emergency_contact_relationship={tenant.emergency_contact_relationship}
      />

      {/* Tenant Status */}
      <TenantStatusSection
        tenantId={id}
        status={tenant.status}
        move_in_date={tenant.move_in_date}
        move_out_date={tenant.move_out_date}
        notice_date={tenant.notice_date}
        move_out_reason={tenant.move_out_reason}
        send_rent_reminders={tenant.send_rent_reminders}
      />

      {/* Insurance - commented out for now
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Insurance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Provider</p>
            <p className="text-gray-900 font-medium mt-1">{tenant.insurance_provider || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Policy #</p>
            <p className="text-gray-900 font-medium mt-1">{lease?.insurance_policy_number || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Expiration</p>
            <p className="text-gray-900 font-medium mt-1">{fmt(tenant.insurance_expiration)}</p>
          </div>
          <div>
            <p className="text-gray-500">Days Until Expiration</p>
            <p className={`font-medium mt-1 ${tenant.insurance_expiration && Math.ceil((new Date(tenant.insurance_expiration).getTime() - Date.now()) / 86400000) < 30 ? 'text-red-600' : 'text-gray-900'}`}>
              {tenant.insurance_expiration ? `${Math.ceil((new Date(tenant.insurance_expiration).getTime() - Date.now()) / 86400000)} days` : '—'}
            </p>
          </div>
        </div>
      </div>
      */}

      {/* Activities */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Activities</h2>
          <span className="text-sm text-gray-500">{activities?.length || 0} total</span>
        </div>
        <TenantActivitySection tenantId={id} tenantName={fullName} activities={activities || []} />
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Payment History</h2>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">Total Paid: <span className="font-semibold text-gray-900">{fmtMoney(totalPaid)}</span></span>
            <span className="text-gray-500">Late Payments: <span className={`font-semibold ${lateCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lateCount}</span></span>
          </div>
        </div>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">For Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Late Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{fmt(p.for_month)}</td>
                    <td className="px-4 py-2 text-gray-700">{fmt(p.payment_date)}</td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-2 text-right text-red-600">{p.late_fee > 0 ? fmtMoney(p.late_fee) : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{p.payment_method || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : p.status === 'late' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                        {p.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{p.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No payment records found.</p>
        )}
      </div>

      {/* Maintenance Requests */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Maintenance Requests</h2>
          <span className="text-sm text-gray-500">{maintenance?.length || 0} total</span>
        </div>
        {maintenance && maintenance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor(m.priority)}`}>
                        {m.priority || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${maintenanceStatusColor(m.status)}`}>
                        {m.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{fmt(m.reported_date)}</td>
                    <td className="px-4 py-2 text-gray-500">{fmt(m.completed_date)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{m.actual_cost != null ? fmtMoney(m.actual_cost) : m.estimated_cost != null ? `~${fmtMoney(m.estimated_cost)}` : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{m.assigned_to || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No maintenance requests found.</p>
        )}
      </div>

    </div>
  )
}
