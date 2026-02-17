import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createSupabaseServer()

  const { data: properties } = await supabase
    .from('properties_with_owners')
    .select('*')
    .order('name')

  const { data: financials } = await supabase
    .from('property_financials')
    .select('*')

  const totalUnits = financials?.reduce((sum, p) => sum + p.total_units, 0) || 0
  const occupiedUnits = financials?.reduce((sum, p) => sum + p.occupied_units, 0) || 0
  const totalIncome = financials?.reduce((sum, p) => sum + Number(p.monthly_income), 0) || 0
  const avgOccupancy = financials?.reduce((sum, p) => sum + Number(p.occupancy_rate), 0) / (financials?.length || 1)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Portfolio</h1>
      <p className="text-gray-600 mb-8">Your real estate dashboard</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Properties</div>
          <div className="text-3xl font-bold text-gray-900">{properties?.length || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Total Units</div>
          <div className="text-3xl font-bold text-gray-900">{totalUnits}</div>
          <div className="text-sm text-green-600 mt-1">{occupiedUnits} occupied</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Monthly Income</div>
          <div className="text-3xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Occupancy Rate</div>
          <div className="text-3xl font-bold text-[#b22625]">{avgOccupancy.toFixed(1)}%</div>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Properties</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {properties?.map((property) => (
            <div key={property.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    <Link
                      href={`/rent-roll?property=${encodeURIComponent(property.name)}`}
                      className="text-[#b22625] hover:text-[#8a1d1c] hover:underline"
                    >
                      {property.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {property.address}, {property.city}, {property.state} {property.zip}
                  </p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-sm text-gray-500">{property.property_type.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-500">{property.total_units} units</span>
                    <span className="text-sm text-gray-500">{property.owner_count} owners</span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-green-600">${Number(property.monthly_income || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">per month</div>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      property.occupancy_rate === 100
                        ? 'bg-green-100 text-green-800'
                        : property.occupancy_rate === 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {property.occupancy_rate}% occupied
                    </span>
                  </div>
                </div>
              </div>
              {property.owners && property.owners.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Owners:</div>
                  <div className="flex flex-wrap gap-2">
                    {property.owners.map((owner: string, idx: number) => (
                      <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{owner}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
