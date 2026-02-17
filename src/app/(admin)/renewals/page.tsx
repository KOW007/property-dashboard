import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RenewalsPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const propertyFilter = params.property

  let query = supabase
    .from('lease_renewals')
    .select('*')
    .order('days_remaining')

  if (propertyFilter) {
    query = query.eq('property_name', propertyFilter)
  }

  const { data: renewals } = await query

  const properties = [...new Set(renewals?.map(r => r.property_name).filter(Boolean))]

  const totalExpiring = renewals?.length || 0
  const expiring30 = renewals?.filter(r => r.days_remaining <= 30).length || 0
  const expiring60 = renewals?.filter(r => r.days_remaining <= 60).length || 0

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>

            <h1 className="text-4xl font-bold text-gray-900">Lease Renewals</h1>
            <p className="text-gray-600 mt-2">Leases expiring within 90 days</p>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-[#b22625]">{expiring30}</div>
            <div className="text-sm text-gray-500">Expiring in 30 Days</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{expiring60}</div>
            <div className="text-sm text-gray-500">Expiring in 60 Days</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalExpiring}</div>
            <div className="text-sm text-gray-500">Total Expiring (90 Days)</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Property</label>
            <div className="flex gap-2">
              {propertyFilter ? (
                <>
                  <span className="text-sm font-medium text-gray-900">{propertyFilter}</span>
                  <Link href="/renewals" className="text-[#b22625] text-xs hover:underline">clear</Link>
                </>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {properties.map(p => (
                    <Link key={p} href={`/renewals?property=${encodeURIComponent(p)}`} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">{p}</Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Renewals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property - Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Rent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renewals && renewals.length > 0 ? (
                renewals.map((r) => (
                  <tr key={r.lease_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{r.property_name}</div>
                      <div className="text-gray-500">Unit {r.unit_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.tenant_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${Number(r.current_rent).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.days_remaining <= 30
                          ? 'bg-red-100 text-[#8a1d1c]'
                          : r.days_remaining <= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {r.days_remaining} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-[#8a1d1c]">
                        Eligible
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/renewals/new?lease_id=${r.lease_id}`}
                        className="text-[#b22625] hover:text-[#8a1d1c] hover:underline font-medium"
                      >
                        Prepare Renewal
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No leases expiring within 90 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
