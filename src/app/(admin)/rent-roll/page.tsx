import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RentRollPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const propertyFilter = params.property

  let query = supabase
    .from('rent_roll')
    .select('*')
    .order('property_name')
    .order('unit_number')

  if (propertyFilter) {
    query = query.eq('property_name', propertyFilter)
  }

  const { data: rentRoll } = await query

  // Get unique properties for filter
  const allProperties = [...new Set(rentRoll?.map(r => r.property_name).filter(Boolean))]

  // Group by property
  const grouped: Record<string, typeof rentRoll> = {}
  rentRoll?.forEach(row => {
    const prop = row.property_name || 'Unknown'
    if (!grouped[prop]) grouped[prop] = []
    grouped[prop]!.push(row)
  })

  // Grand totals
  const grandTotals = {
    units: rentRoll?.length || 0,
    sqft: rentRoll?.reduce((s, r) => s + Number(r.square_feet || 0), 0) || 0,
    marketRent: rentRoll?.reduce((s, r) => s + Number(r.market_rent || 0), 0) || 0,
    rent: rentRoll?.reduce((s, r) => s + Number(r.monthly_rent || 0), 0) || 0,
    charges: rentRoll?.reduce((s, r) => s + Number(r.monthly_charges || 0), 0) || 0,
    deposit: rentRoll?.reduce((s, r) => s + Number(r.security_deposit || 0), 0) || 0,
  }

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  return (
    <div>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>

              <h1 className="text-3xl font-bold text-gray-900">Rent Roll</h1>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-0.5">
            {propertyFilter && <p><span className="font-medium">Properties:</span> {propertyFilter}</p>}
            <p><span className="font-medium">Units:</span> Active</p>
            <p><span className="font-medium">As of:</span> {today}</p>
          </div>
        </div>

        {/* Property Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 items-center flex-wrap">
          <span className="text-xs text-gray-500 mr-2">Property:</span>
          <Link
            href="/rent-roll"
            className={`px-3 py-1.5 rounded text-xs font-medium border ${!propertyFilter ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            All
          </Link>
          {allProperties.map(p => (
            <Link
              key={p}
              href={`/rent-roll?property=${encodeURIComponent(p)}`}
              className={`px-3 py-1.5 rounded text-xs font-medium border ${propertyFilter === p ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">BD/BA</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Additional Tenants</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sqft</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Rent</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rent</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly Cha...</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deposit</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Move-in</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease From</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(grouped).map(([propertyName, rows]) => {
                const propRows = rows || []
                const propTotals = {
                  units: propRows.length,
                  sqft: propRows.reduce((s, r) => s + Number(r.square_feet || 0), 0),
                  marketRent: propRows.reduce((s, r) => s + Number(r.market_rent || 0), 0),
                  rent: propRows.reduce((s, r) => s + Number(r.monthly_rent || 0), 0),
                  charges: propRows.reduce((s, r) => s + Number(r.monthly_charges || 0), 0),
                  deposit: propRows.reduce((s, r) => s + Number(r.security_deposit || 0), 0),
                }
                const firstRow = propRows[0]
                const fullAddress = [firstRow?.address, firstRow?.city, firstRow?.state, firstRow?.zip].filter(Boolean).join(', ')

                return (
                  <Fragment key={propertyName}>
                    {/* Property Group Header */}
                    <tr className="bg-gray-50">
                      <td colSpan={13} className="px-3 py-2">
                        <span className="text-sm font-semibold text-[#8a1d1c]">
                          {propertyName}{fullAddress ? ` - ${fullAddress}` : ''}
                        </span>
                      </td>
                    </tr>

                    {/* Data Rows */}
                    {propRows.map((row, i) => (
                      <tr key={row.lease_id || i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-[#b22625] font-medium">{row.unit_number}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {row.bedrooms != null ? `${Math.round(row.bedrooms)}/${Math.round(row.bathrooms || 0)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-[#b22625]">{row.tenant_name || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{row.additional_tenants || ''}</td>
                        <td className="px-3 py-2">
                          <span className={
                            row.status === 'Notice-Unrented' ? 'text-yellow-700' :
                            row.status === 'Notice-Rented' ? 'text-[#8a1d1c]' :
                            'text-gray-700'
                          }>
                            {row.status || 'Current'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">{row.square_feet ? Number(row.square_feet).toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{row.market_rent ? Number(row.market_rent).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{Number(row.monthly_rent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{Number(row.monthly_charges || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{Number(row.security_deposit || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-gray-500">{row.move_in_date ? new Date(row.move_in_date).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{row.start_date ? new Date(row.start_date).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{row.end_date ? new Date(row.end_date).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}

                    {/* Property Summary Row */}
                    <tr className="bg-gray-50 font-semibold text-sm">
                      <td colSpan={4} className="px-3 py-2 text-gray-700">
                        {propTotals.units} Units
                      </td>
                      <td className="px-3 py-2 text-gray-700">100.0% Occupied</td>
                      <td className="px-3 py-2 text-right text-gray-700">{propTotals.sqft.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{propTotals.marketRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{propTotals.rent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{propTotals.charges.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{propTotals.deposit.toFixed(2)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Grand Totals Footer */}
        {rentRoll && rentRoll.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-1 px-3 py-3 flex items-center text-sm font-semibold text-gray-700">
            <div className="w-[280px]">{grandTotals.units} Units</div>
            <div className="w-[120px]">100.0% Occupied</div>
            <div className="w-[80px] text-right">{grandTotals.sqft.toLocaleString()}</div>
            <div className="w-[100px] text-right">{grandTotals.marketRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="w-[100px] text-right">{grandTotals.rent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="w-[90px] text-right">{grandTotals.charges.toFixed(2)}</div>
            <div className="w-[90px] text-right">{grandTotals.deposit.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
