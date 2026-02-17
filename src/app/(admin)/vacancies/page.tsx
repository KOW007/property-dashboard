import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function VacanciesPage() {
  const supabase = await createSupabaseServer()
  // Fetch vacant units
  const { data: vacancies } = await supabase
    .from('current_vacancies')
    .select('*')
    .order('property_name')
    .order('unit_number')

  // Calculate potential monthly income if all were leased
  const potentialIncome = vacancies?.reduce((sum, unit) => 
    sum + Number(unit.market_rent || 0), 0
  ) || 0

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>

            <h1 className="text-4xl font-bold text-gray-900">Vacant Units</h1>
            <p className="text-gray-600 mt-2">Available units ready to lease</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Vacant Units</p>
            <p className="text-3xl font-bold text-[#b22625]">
              {vacancies?.length || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">Potential Monthly Income</p>
            <p className="text-2xl font-semibold text-green-600">
              ${potentialIncome.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Vacancies Grid */}
        {vacancies && vacancies.length > 0 ? (
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
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    unit.lease_status === 'preleased'
                      ? 'bg-red-100 text-[#8a1d1c]'
                      : unit.lease_status === 'notice-unrented'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {unit.lease_status === 'preleased' ? 'Preleased' : unit.lease_status === 'notice-unrented' ? 'Notice-Unrented' : 'Vacant'}
                  </span>
                </div>

                {/* Unit Details */}
                <div className="space-y-2 mb-4">
                  {unit.bedrooms && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-medium">🛏️ Bedrooms:</span>
                      <span className="ml-2">{unit.bedrooms}</span>
                    </div>
                  )}
                  {unit.bathrooms && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-medium">🚿 Bathrooms:</span>
                      <span className="ml-2">{unit.bathrooms}</span>
                    </div>
                  )}
                  {unit.square_feet && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="font-medium">📐 Sq Ft:</span>
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
                        <span 
                          key={i}
                          className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
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
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Vacancies!
            </h2>
            <p className="text-gray-600">
              All units are currently occupied. Great job!
            </p>
          </div>
        )}

        {/* Summary by Property */}
        {vacancies && vacancies.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vacancy Summary by Property
            </h2>
            <div className="space-y-3">
              {Object.entries(
                vacancies.reduce((acc: any, unit) => {
                  const prop = unit.property_name;
                  if (!acc[prop]) {
                    acc[prop] = { count: 0, income: 0 };
                  }
                  acc[prop].count += 1;
                  acc[prop].income += Number(unit.market_rent || 0);
                  return acc;
                }, {})
              ).map(([property, data]: [string, any]) => (
                <div key={property} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-gray-900">{property}</span>
                    <span className="ml-3 text-sm text-gray-500">
                      {data.count} vacant {data.count === 1 ? 'unit' : 'units'}
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
