import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Vacant', value: 'vacant' },
  { label: 'Notice', value: 'notice-unrented' },
  { label: 'Preleased', value: 'preleased' },
]

function statusLabel(s: string) {
  if (s === 'preleased') return 'Preleased'
  if (s === 'notice-unrented') return 'Notice'
  return 'Vacant'
}

function statusBadgeClass(s: string) {
  if (s === 'preleased') return 'bg-red-100 text-[#8a1d1c]'
  if (s === 'notice-unrented') return 'bg-yellow-100 text-yellow-800'
  return 'bg-orange-100 text-orange-800'
}

export default async function VacanciesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const statusFilter = params.status || ''

  const { data: allVacancies } = await supabase
    .from('current_vacancies')
    .select('*')
    .order('property_name')
    .order('unit_number')

  const vacancies = statusFilter
    ? (allVacancies || []).filter(u => u.lease_status === statusFilter)
    : (allVacancies || [])

  const potentialIncome = vacancies.reduce((sum, unit) =>
    sum + Number(unit.market_rent || 0), 0
  )

  const counts = {
    vacant: (allVacancies || []).filter(u => u.lease_status !== 'preleased' && u.lease_status !== 'notice-unrented').length,
    'notice-unrented': (allVacancies || []).filter(u => u.lease_status === 'notice-unrented').length,
    preleased: (allVacancies || []).filter(u => u.lease_status === 'preleased').length,
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Vacant, Notice &amp; Preleased</h1>
            <p className="text-gray-600 mt-2">Units that are vacant, under notice, or preleased</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Showing</p>
            <p className="text-3xl font-bold text-[#b22625]">{vacancies.length}</p>
            <p className="text-sm text-gray-500 mt-2">Potential Monthly Income</p>
            <p className="text-2xl font-semibold text-green-600">
              ${potentialIncome.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 mr-2">Filter by status:</span>
          {STATUS_FILTERS.map(f => {
            const count = f.value === ''
              ? (allVacancies || []).length
              : (counts as any)[f.value] ?? 0
            const active = statusFilter === f.value
            return (
              <Link
                key={f.value}
                href={f.value ? `/vacancies?status=${f.value}` : '/vacancies'}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-[#b22625] text-white border-[#b22625]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.label} <span className={`ml-1 text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>({count})</span>
              </Link>
            )
          })}
        </div>

        {/* Vacancies Grid */}
        {vacancies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vacancies.map((unit, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Unit {unit.unit_number}
                    </h3>
                    <p className="text-sm text-gray-600">{unit.property_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{unit.address}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeClass(unit.lease_status)}`}>
                    {statusLabel(unit.lease_status)}
                  </span>
                </div>

                {/* Unit Details */}
                <div className="space-y-2 mb-4">
                  {unit.bedrooms && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-medium">Bedrooms:</span>
                      <span className="ml-2">{unit.bedrooms}</span>
                    </div>
                  )}
                  {unit.bathrooms && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-medium">Bathrooms:</span>
                      <span className="ml-2">{unit.bathrooms}</span>
                    </div>
                  )}
                  {unit.square_feet && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-medium">Sq Ft:</span>
                      <span className="ml-2">{unit.square_feet.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {unit.amenities && unit.amenities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {unit.amenities.map((amenity: string, i: number) => (
                        <span key={i} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Rent */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Market Rent:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${Number(unit.market_rent || 0).toLocaleString()}
                      <span className="text-sm text-gray-500 font-normal">/mo</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No units found</h2>
            <p className="text-gray-600">No units match the selected filter.</p>
          </div>
        )}

        {/* Summary by Property */}
        {vacancies.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary by Property</h2>
            <div className="space-y-3">
              {Object.entries(
                vacancies.reduce((acc: any, unit) => {
                  const prop = unit.property_name
                  if (!acc[prop]) acc[prop] = { count: 0, income: 0 }
                  acc[prop].count += 1
                  acc[prop].income += Number(unit.market_rent || 0)
                  return acc
                }, {})
              ).map(([property, data]: [string, any]) => (
                <div key={property} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-gray-900">{property}</span>
                    <span className="ml-3 text-sm text-gray-500">
                      {data.count} {data.count === 1 ? 'unit' : 'units'}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">
                    ${data.income.toLocaleString()}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
