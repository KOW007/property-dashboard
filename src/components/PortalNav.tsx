'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Home', href: '/portal' },
  { label: 'Payments', href: '/portal/payments' },
  { label: 'Maintenance', href: '/portal/maintenance' },
  { label: 'Contact Us', href: '/portal/contact' },
  { label: 'Property Details', href: '/portal/property' },
  { label: 'Account Profile', href: '/portal/account' },
]

export default function PortalNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#b22625] text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
