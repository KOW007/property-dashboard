import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getPortalTenant } from '@/lib/portal-auth'
import PortalNav from '@/components/PortalNav'
import Image from 'next/image'
import Link from 'next/link'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/portal-login')
  }

  // Secure lookup — prefers auth_user_id, falls back to email, auto-populates on first login
  const tenant = await getPortalTenant(supabase, user, 'id, first_name, last_name')

  // Use rent_roll — already has address/unit info joined correctly
  const { data: rentRow } = tenant ? await supabase
    .from('rent_roll')
    .select('*')
    .eq('tenant_id', tenant.id)
    .limit(1)
    .single() : { data: null }

  const unit = rentRow ? { unit_number: rentRow.unit_number } : null
  const property = rentRow ? {
    address: rentRow.address,
    city: rentRow.city,
    state: rentRow.state,
    zip: rentRow.zip,
  } : null
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
