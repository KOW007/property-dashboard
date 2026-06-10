import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import PropertyGallery from '@/components/PropertyGallery'

export const dynamic = 'force-dynamic'

const BUCKET = 'property-photos'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export default async function ForRentPage() {
  const supabase = await createSupabaseServer()
  const serviceSupabase = getServiceSupabase()

  const [{ data: allVacancies }, { data: properties }, { data: hiddenUnits }] = await Promise.all([
    supabase.from('current_vacancies').select('*').order('property_name').order('unit_number'),
    serviceSupabase.from('properties').select('id, name'),
    serviceSupabase.from('units').select('id').eq('hide_from_public', true),
  ])

  const hiddenIds = new Set((hiddenUnits ?? []).map(u => u.id))
  const vacancies = (allVacancies ?? []).filter(u => !hiddenIds.has(u.unit_id))

  // Build name → id map
  const propertyIdByName: Record<string, string> = {}
  properties?.forEach(p => { propertyIdByName[p.name] = p.id })

  // Group vacancies by property
  const grouped: Record<string, typeof vacancies> = {}
  vacancies?.forEach((unit) => {
    if (!grouped[unit.property_name]) grouped[unit.property_name] = []
    grouped[unit.property_name]!.push(unit)
  })

  // Fetch up to 9 photos per property
  const propertyPhotos: Record<string, string[]> = {}
  await Promise.all(
    Object.keys(grouped).map(async (name) => {
      const id = propertyIdByName[name]
      if (!id) return
      const { data } = await serviceSupabase.storage
        .from(BUCKET)
        .list(id, { limit: 9, sortBy: { column: 'created_at', order: 'asc' } })
      const urls = (data ?? [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => serviceSupabase.storage.from(BUCKET).getPublicUrl(`${id}/${f.name}`).data.publicUrl)
      if (urls.length) propertyPhotos[name] = urls
    })
  )

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
                <div
                  key={propertyName}
                  id={propertyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                  className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-6"
                >
                  {/* Property photos */}
                  {propertyPhotos[propertyName]?.length > 0 && (
                    <PropertyGallery photos={propertyPhotos[propertyName]} alt={propertyName} />
                  )}

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
