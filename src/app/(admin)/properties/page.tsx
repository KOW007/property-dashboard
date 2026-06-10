import { createClient } from '@supabase/supabase-js'
import PropertyPhotosManager from '@/components/PropertyPhotosManager'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export default async function PropertiesPage() {
  const supabase = getServiceSupabase()
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .order('name')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="text-sm text-gray-500 mt-1">Manage photos for each property.</p>
      </div>
      <PropertyPhotosManager properties={properties ?? []} />
    </div>
  )
}
