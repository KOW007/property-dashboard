import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import PortalNav from '@/components/PortalNav'
import Image from 'next/image'
import Link from 'next/link'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal-login')
  }

  // Get tenant info by email
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, first_name, last_name')
    .eq('email', user.email)
    .single()

  // Get unit_id from most recent lease
  const { data: recentLease } = tenant ? await supabase
    .from('leases')
    .select('unit_id')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single() : { data: null }

  // Get unit, then property separately (avoids relying on FK join)
  const { data: unit } = recentLease?.unit_id ? await supabase
    .from('units')
    .select('unit_number, property_id')
    .eq('id', recentLease.unit_id)
    .single() : { data: null }

  const property = unit?.property_id ? (await supabase
    .from('properties')
    .select('name, address, city, state, zip')
    .eq('id', unit.property_id)
    .single()).data : null
  const propertyAddress = property
    ? `${property.address}, ${unit?.unit_number}, ${property.city}, ${property.state} ${property.zip}`
    : ''

  const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : user.email

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-[#2d2d2d] text-white flex flex-col min-h-screen fixed">
        {/* Logo + Tenant Name */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/portal">
            <Image src="/logo.png" alt="Spearhead Properties" width={160} height={30} priority />
          </Link>
          <div className="mt-4">
            <p className="text-xs text-white/50 uppercase tracking-wider">The Portal of</p>
            <p className="text-sm font-semibold text-white mt-0.5">{tenantName}</p>
          </div>
        </div>

        {/* Navigation */}
        <PortalNav />

        {/* Log Out */}
        <div className="px-4 py-4 border-t border-white/10">
          <form action="/api/portal-logout" method="POST">
            <button
              type="submit"
              className="w-full text-left text-sm text-white/60 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-xs text-gray-500">
            {propertyAddress && (
              <span><span className="font-medium text-gray-700">Property Address</span> {propertyAddress}</span>
            )}
          </div>
          <form action="/api/portal-logout" method="POST">
            <button type="submit" className="text-sm text-[#b22625] hover:text-[#8a1d1c] font-medium">
              ↪ Log Out
            </button>
          </form>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
