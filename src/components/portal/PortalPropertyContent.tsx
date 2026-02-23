import LeaseDocumentLinks from './LeaseDocumentLinks'
import LeaseDocumentLinksAdmin from './LeaseDocumentLinksAdmin'

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
  document_url?: string | null
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
  isAdmin?: boolean
}

export default function PortalPropertyContent({ property, unit, leases, documents, isAdmin }: Props) {
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
              <div className="space-y-3">
                {leases.map((lease, i) => {
                  const dateRange = `${new Date(lease.start_date + 'T00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} – ${new Date(lease.end_date + 'T00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">{dateRange}</p>
                        <p className="text-xs text-gray-500">${Number(lease.monthly_rent).toLocaleString()}/mo</p>
                      </div>
                      {lease.document_url ? (
                        isAdmin
                          ? <LeaseDocumentLinksAdmin filePath={lease.document_url} />
                          : <LeaseDocumentLinks filePath={lease.document_url} />
                      ) : (
                        <span className="text-xs text-gray-300 italic">No PDF</span>
                      )}
                    </div>
                  )
                })}
              </div>
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
