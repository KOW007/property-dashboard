import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ForRentPage() {
  const supabase = await createSupabaseServer()

  const { data: vacancies } = await supabase
    .from('current_vacancies')
    .select('*')
    .order('property_name')
    .order('unit_number')

  // Group by property
  const grouped: Record<string, typeof vacancies> = {}
  vacancies?.forEach((unit) => {
    const key = unit.property_name
    if (!grouped[key]) grouped[key] = []
    grouped[key]!.push(unit)
  })

  const totalVacant = vacancies?.length || 0

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#2d2d2d] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Available Rentals</h1>
          <p className="text-white/80 text-lg">
            {totalVacant} {totalVacant === 1 ? 'unit' : 'units'} currently available
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          {totalVacant === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-gray-400 mb-3">No Vacancies Right Now</h2>
              <p className="text-gray-500 mb-6">All units are currently occupied. Check back soon or contact us to get on our waiting list.</p>
              <Link
                href="/contact"
                className="inline-block bg-[#2d2d2d] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a1a1a] transition-colors"
              >
                Contact Us
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([propertyName, units]) => (
                <div key={propertyName} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-[#2d2d2d] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">{propertyName}</h2>
                    {units?.[0] && (
                      <p className="text-white/70 text-sm">
                        {units[0].address}, {units[0].city}, {units[0].state} {units[0].zip}
                      </p>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {units?.map((unit) => (
                      <div key={unit.unit_id || unit.unit_number} className="p-6 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900">Unit {unit.unit_number}</h3>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            {unit.bedrooms != null && (
                              <span>{unit.bedrooms} BD / {unit.bathrooms} BA</span>
                            )}
                            {unit.square_feet && (
                              <span>{unit.square_feet} sqft</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#b22625]">
                            ${Number(unit.market_rent || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">per month</div>
                          <Link
                            href="/apply"
                            className="mt-2 inline-block bg-[#b22625] text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-[#8a1d1c] transition-colors"
                          >
                            Apply Now
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
