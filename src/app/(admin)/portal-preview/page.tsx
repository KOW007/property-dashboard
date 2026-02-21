import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PortalPreviewListPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const params = await searchParams

  // If email param provided, look up tenant and redirect directly to their preview
  if (params.email) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', params.email)
      .single()

    if (tenant) {
      redirect(`/portal-preview/${tenant.id}`)
    }
  }

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, email, unit_id, units(unit_number, properties(name))')
    .order('last_name')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tenant Portal Preview</h1>
        <p className="text-sm text-gray-500 mt-1">Select a tenant to preview their portal view.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants?.map((tenant) => {
              const unit = tenant.units as any
              const property = unit?.properties as any
              return (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tenant.first_name} {tenant.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{tenant.email}</td>
                  <td className="px-4 py-3 text-gray-600">{property?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{unit?.unit_number || '—'}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal-preview/${tenant.id}`}
                      className="inline-flex items-center gap-1.5 bg-[#2d2d2d] text-white text-xs px-3 py-1.5 rounded hover:bg-black font-medium"
                    >
                      👁 View Portal
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!tenants || tenants.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No tenants found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
