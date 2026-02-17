export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#2d2d2d] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/80 text-lg">We&apos;d love to hear from you</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#2d2d2d] mb-6">Get in Touch</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</h3>
                  <p className="text-lg text-gray-900">(512) 236-1512</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</h3>
                  <p className="text-lg text-gray-900">info@spearheadproperties.com</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Mailing Address</h3>
                  <p className="text-lg text-gray-900">
                    PO Box 50408<br />
                    Austin, TX 78763
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Office Hours</h3>
                  <p className="text-lg text-gray-900">
                    Monday - Friday: 9:00 AM - 5:00 PM<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div>
              <h2 className="text-2xl font-bold text-[#2d2d2d] mb-6">Quick Info</h2>
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">Maintenance Requests</h3>
                  <p className="text-gray-600 text-sm">
                    Current tenants can submit maintenance requests through the tenant portal or by calling our office.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">Rental Applications</h3>
                  <p className="text-gray-600 text-sm">
                    Interested in renting? Visit our <a href="/apply" className="text-[#b22625] hover:underline">application page</a> to get started.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d] mb-1">Available Rentals</h3>
                  <p className="text-gray-600 text-sm">
                    Browse our current <a href="/for-rent" className="text-[#b22625] hover:underline">available properties</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
