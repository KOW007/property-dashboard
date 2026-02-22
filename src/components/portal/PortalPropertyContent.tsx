interface PropertyInfo {
  name?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
}

interface UnitInfo {
  unit_number?: string
}

interface Lease {
  start_date: string
  end_date: string
  monthly_rent: number | string
}

interface Document {
  id: string
  name: string
  url: string
  created_at: string
}

interface Props {
  property: PropertyInfo | null
  unit: UnitInfo | null
  leases: Lease[] | null
  documents: Document[] | null
}

export default function PortalPropertyContent({ property, unit, leases, documents }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Property Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Address + Leases */}
        <div className="space-y-6">
          {/* Address */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Address</h2>
            {property ? (
              <div className="text-gray-700">
                <p>{property.address}</p>
                <p>{unit?.unit_number}</p>
                <p>{property.city}, {property.state} {property.zip}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Address not available.</p>
            )}
          </div>

          {/* Leases */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Leases</h2>
            {leases && leases.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Lease Dates</th>
                    <th className="text-right px-3 py-2 text-gray-500 font-medium">Monthly Rent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leases.map((lease, i) => (
                    <tr key={i}>
                      <td className="px-3 py-3 text-gray-700">
                        {new Date(lease.start_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        {' – '}
                        {new Date(lease.end_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 font-medium">
                        ${Number(lease.monthly_rent).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-400">No lease records found.</p>
            )}
          </div>
        </div>

        {/* Contact Info + Documents */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Info</h2>
            <p className="font-semibold text-gray-800 mb-3">Spearhead Properties</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Text</span>
                <a href="sms:+18634003306" className="text-[#b22625] hover:underline">+1(863) 400-3306</a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Call</span>
                <a href="tel:5122361512" className="text-[#b22625] hover:underline">(512) 236-1512</a>
              </div>
            </div>
          </div>

          {/* Shared Documents */}
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Shared Documents</h2>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#b22625] hover:underline"
                  >
                    📄 {doc.name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No shared documents available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
