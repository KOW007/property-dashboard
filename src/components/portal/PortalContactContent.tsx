import Link from 'next/link'

interface Props {
  isPreview?: boolean
}

export default function PortalContactContent({ isPreview }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>

      <div className="max-w-xl space-y-6">
        {/* Main Contact */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Spearhead Properties</h2>
          <div className="space-y-3">
            <a
              href="mailto:info@spearheadproperties.com"
              className="flex items-center justify-center w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              ✉️ Email Us info@spearheadproperties.com
            </a>
            <a
              href="tel:5122361512"
              className="flex items-center justify-center w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              📞 Call Us (512) 236-1512
            </a>
          </div>
        </div>

        {/* Other Options */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Other Contact Options</h2>
          <div className="space-y-3">
            {isPreview ? (
              <>
                <div className="flex items-center justify-center w-full border border-gray-200 text-gray-400 py-2.5 rounded-lg font-medium text-sm">
                  🔧 Request Maintenance
                </div>
                <div className="flex items-center justify-center w-full border border-gray-200 text-gray-400 py-2.5 rounded-lg font-medium text-sm">
                  📋 Request to Move Out
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/portal/maintenance"
                  className="flex items-center justify-center w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  🔧 Request Maintenance
                </Link>
                <Link
                  href="/portal/contact/notice-to-vacate"
                  className="flex items-center justify-center w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  📋 Request to Move Out
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
