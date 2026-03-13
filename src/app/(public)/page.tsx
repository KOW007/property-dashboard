import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import HeroSlideshow from '@/components/HeroSlideshow'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createSupabaseServer()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('name')

  return (
    <div>
      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* Communities Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#2d2d2d] text-center mb-3">Our Communities</h2>
          <p className="text-gray-600 text-center mb-10 max-w-xl mx-auto">
            We manage beautiful properties across Austin, TX. Explore our communities and find your perfect home.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties?.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Placeholder for property image */}
                <div className="h-48 bg-gradient-to-br from-[#2d2d2d] to-[#4a4a4a] flex items-center justify-center">
                  <span className="text-white/50 text-sm uppercase tracking-wider">Property Photo</span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#2d2d2d] mb-1">{property.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {property.address}, {property.city}, {property.state} {property.zip}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {property.total_units} units &middot; {property.property_type?.replace('_', ' ')}
                    </span>
                    <Link
                      href="/for-rent"
                      className="text-[#b22625] hover:text-[#8a1d1c] text-sm font-semibold"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#2d2d2d] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your New Home?</h2>
          <p className="text-white/80 mb-8 text-lg">
            Browse our available rentals and submit your application today.
          </p>
          <Link
            href="/apply"
            className="inline-block bg-white text-[#2d2d2d] px-8 py-3 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
          >
            Start Your Application
          </Link>
        </div>
      </section>
    </div>
  )
}
