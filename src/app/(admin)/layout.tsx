import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import LogoutButton from '@/components/LogoutButton'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Rent Roll', href: '/rent-roll' },
  { label: 'Move Ins/Outs', href: '/move-ins-outs' },
  { label: 'Vacancies', href: '/vacancies' },
  { label: 'Work Orders', href: '/work-orders' },
  { label: 'Renewals', href: '/renewals' },
  { label: 'Applications', href: '/applications' },
  { label: 'Service Requests', href: '/service-request' },
  { label: 'Accounting', href: '/accounting/receivables' },
  { label: 'Tenant Portals', href: '/portal-preview' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2d2d2d] text-white flex flex-col min-h-screen fixed">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/dashboard" className="block px-3 py-1.5">
            <Image
              src="/logo.png"
              alt="Spearhead Properties"
              width={200}
              height={36}
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="text-sm text-gray-500">Admin Dashboard</div>
          <Link href="/" className="text-sm text-[#2d2d2d] hover:text-[#b22625] font-medium">
            View Public Site
          </Link>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
