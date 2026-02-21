import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PortalPreviewPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, email, phone, unit_id')
    .eq('id', tenantId)
    .single()

  if (!tenant) notFound()

  // Get unit + property
  const { data: unit } = await supabase
    .from('units')
    .select('unit_number, property_id, properties(name, address, city, state, zip, phone)')
    .eq('id', tenant.unit_id)
    .single()

  const property = unit?.properties as any
  const propertyAddress = property
    ? `${property.address}, Unit ${unit?.unit_number}, ${property.city}, ${property.state} ${property.zip}`
    : ''

  // Get lease
  const { data: lease } = await supabase
    .from('leases')
    .select('monthly_rent, start_date, end_date')
    .eq('unit_id', tenant.unit_id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  // Get upcoming charges
  const { data: charges } = await supabase
    .from('receivables')
    .select('description, amount, date, type')
    .eq('unit_id', tenant.unit_id)
    .eq('type', 'charge')
    .order('date', { ascending: true })
    .limit(10)

  // Get open maintenance requests
  const { data: openRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, status, reported_date')
    .eq('unit_id', tenant.unit_id)
    .in('status', ['open', 'in_progress'])
    .order('reported_date', { ascending: false })

  // Get payment history
  const { data: allReceivables } = await supabase
    .from('receivables')
    .select('description, amount, date, type')
    .eq('unit_id', tenant.unit_id)
    .order('date', { ascending: false })
    .limit(20)

  const totalBalance = charges?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0
  const nextCharge = charges?.[0]
  const tenantName = `${tenant.first_name} ${tenant.last_name}`

  return (
    <div>
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

      {/* Portal Preview Frame */}
      <div className="flex gap-6">

        {/* Sidebar Preview */}
        <div className="w-48 bg-[#2d2d2d] text-white rounded-lg flex flex-col flex-shrink-0 self-start sticky top-0 overflow-hidden">
          <div className="px-4 py-4 border-b border-white/10">
            <p className="text-xs text-white/50 uppercase tracking-wider">The Portal of</p>
            <p className="text-sm font-semibold text-white mt-0.5">{tenantName}</p>
          </div>
          <nav className="px-3 py-3 space-y-1">
            {[
              { label: 'Home', active: true },
              { label: 'Payments' },
              { label: 'Maintenance' },
              { label: 'Contact Us' },
              { label: 'Property Details' },
              { label: 'Account Profile' },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  item.active ? 'bg-[#b22625] text-white' : 'text-white/70'
                }`}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Portal Content */}
        <div className="flex-1 space-y-6">

          <h1 className="text-2xl font-bold text-gray-900">Home</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="bg-white rounded-xl shadow-sm border-t-4 border-green-500 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Current Balance</h2>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {nextCharge && (
                <p className="text-sm text-gray-500 mb-4">
                  Next bill due {new Date(nextCharge.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {charges && charges.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Upcoming Charges</h3>
                  <div className="divide-y divide-gray-100">
                    {charges.slice(0, 5).map((charge, i) => (
                      <div key={i} className="flex justify-between py-2 text-sm">
                        <div>
                          <div className="font-medium text-gray-800">{charge.description}</div>
                          <div className="text-xs text-gray-400">
                            Due {new Date(charge.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div className="font-semibold">${Number(charge.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!charges || charges.length === 0) && (
                <p className="text-sm text-gray-400">No upcoming charges.</p>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Lease Info */}
              {lease && (
                <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">Lease Summary</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Monthly Rent</p>
                      <p className="text-xl font-bold text-gray-900">${Number(lease.monthly_rent).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lease Ends</p>
                      <p className="text-xl font-bold text-gray-900">
                        {new Date(lease.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lease Start</p>
                      <p className="font-semibold text-gray-700">
                        {new Date(lease.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance */}
              <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Maintenance Requests</h2>
                {openRequests && openRequests.length > 0 ? (
                  <div className="space-y-2">
                    {openRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{req.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.status === 'in_progress' ? 'In Progress' : 'Open'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No open maintenance requests.</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          {allReceivables && allReceivables.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Payment History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-100">
                  <thead>
                    <tr className="text-xs font-medium text-gray-500 uppercase">
                      <th className="pb-2 text-left">Date</th>
                      <th className="pb-2 text-left">Description</th>
                      <th className="pb-2 text-left">Type</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allReceivables.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-500">
                          {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2 text-gray-800">{r.description}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            r.type === 'payment' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className={`py-2 text-right font-semibold ${r.type === 'payment' ? 'text-green-600' : 'text-gray-900'}`}>
                          {r.type === 'payment' ? '-' : ''}${Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium mb-1">Property</p>
                <p className="text-gray-800">{property?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Unit</p>
                <p className="text-gray-800">{unit?.unit_number || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Address</p>
                <p className="text-gray-800">{propertyAddress || '—'}</p>
              </div>
              {property?.phone && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Office Phone</p>
                  <p className="text-gray-800">{property.phone}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 font-medium mb-1">Tenant Email</p>
                <p className="text-gray-800">{tenant.email}</p>
              </div>
              {tenant.phone && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Tenant Phone</p>
                  <p className="text-gray-800">{tenant.phone}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
