export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#2d2d2d] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">About Spearhead Properties</h1>
          <p className="text-white/80 text-lg">Providing Austin with beautiful rentals since 2001</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-[#2d2d2d] mb-4">Our Story</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Spearhead Properties has been a trusted name in Austin real estate since 2001. We specialize in providing
              beautiful, well-maintained rental properties throughout the Austin area. Our commitment to quality living
              spaces and responsive property management has made us a preferred choice for renters in the Austin community.
            </p>

            <h2 className="text-2xl font-bold text-[#2d2d2d] mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              We believe everyone deserves a beautiful place to call home. Our mission is to provide high-quality rental
              properties with exceptional service, creating communities where residents feel at home from day one.
            </p>

            <h2 className="text-2xl font-bold text-[#2d2d2d] mb-4">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#2d2d2d] mb-2">Quality Properties</h3>
                <p className="text-gray-600 text-sm">Well-maintained apartments and homes across Austin&apos;s best neighborhoods.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#2d2d2d] mb-2">Responsive Management</h3>
                <p className="text-gray-600 text-sm">Quick response to maintenance requests and tenant needs.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#2d2d2d] mb-2">Community Focus</h3>
                <p className="text-gray-600 text-sm">Building lasting communities where residents thrive.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#2d2d2d] mb-2">Austin Expertise</h3>
                <p className="text-gray-600 text-sm">Over two decades of experience in the Austin rental market.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
