import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'Properties', href: '/for-rent' },
  { label: 'Apply', href: '/apply' },
  { label: 'Contact', href: '/contact' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#2d2d2d] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center bg-white rounded-lg px-3 py-1.5">
            <Image
              src="/logo.png"
              alt="Spearhead Properties"
              width={220}
              height={40}
              priority
            />
          </Link>

          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-white/90 hover:text-white uppercase tracking-wider transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="ml-4 bg-[#b22625] hover:bg-[#8a1d1c] text-white px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#2d2d2d] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="bg-white rounded-lg px-3 py-1.5 inline-block mb-4">
                <Image
                  src="/logo.png"
                  alt="Spearhead Properties"
                  width={180}
                  height={32}
                />
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Providing Austin with beautiful rentals since 2001.
              </p>
              <p className="text-white/70 text-sm mt-3">
                PO Box 50408<br />
                Austin, TX 78763
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-3">Quick Links</h3>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-3">Contact Us</h3>
              <p className="text-white/70 text-sm">
                Phone: (512) 236-1512
              </p>
              <p className="text-white/70 text-sm mt-2">
                Email: info@spearheadproperties.com
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} Spearhead Properties. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
