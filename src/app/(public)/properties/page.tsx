import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const BUCKET = 'property-photos'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export default async function PropertiesPublicPage() {
  const supabase = getServiceSupabase()

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('name')

  // Fetch first photo for each property
  const photos: Record<string, string> = {}
  await Promise.all(
    (properties ?? []).map(async (prop) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .list(prop.id, { limit: 1, sortBy: { column: 'created_at', order: 'asc' } })
      const first = data?.find(f => f.name !== '.emptyFolderPlaceholder')
      if (first) {
        photos[prop.id] = supabase.storage
          .from(BUCKET)
          .getPublicUrl(`${prop.id}/${first.name}`).data.publicUrl
      }
    })
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#2d2d2d] mb-10 uppercase tracking-wide">Our Properties</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(properties ?? []).map((prop) => (
          <Link
            key={prop.id}
            href={`/for-rent`}
            className="group relative block overflow-hidden rounded-sm aspect-[4/3] bg-gray-200"
          >
            {photos[prop.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[prop.id]}
                alt={prop.name}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No photo</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Property name */}
            <div className="absolute bottom-0 left-0 p-5">
              <p className="text-white font-bold uppercase tracking-widest text-base leading-tight">
                {prop.name}
              </p>
              {prop.neighborhood && (
                <p className="text-white/75 text-sm mt-0.5">{prop.neighborhood}</p>
              )}
              {!prop.neighborhood && prop.city && (
                <p className="text-white/75 text-sm mt-0.5">{prop.city}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
