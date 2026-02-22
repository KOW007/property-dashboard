interface MaintenanceRequest {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  reported_date: string
  notes?: string
}

interface Props {
  openRequests: MaintenanceRequest[] | null
  closedRequests: MaintenanceRequest[] | null
  isPreview?: boolean
  // For the real portal — slot in the form as a child
  formSlot?: React.ReactNode
}

export default function PortalMaintenanceContent({ openRequests, closedRequests, isPreview, formSlot }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Maintenance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Requests + Submit Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Maintenance Requests</h2>

            {formSlot}

            {isPreview && (
              <div className="mb-4 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Submit a Request (tenant view)</p>
                <div className="space-y-2 opacity-50 pointer-events-none">
                  <input disabled placeholder="Title / Issue" className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white" />
                  <textarea disabled placeholder="Describe the issue..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white" />
                  <div className="flex gap-2">
                    <select disabled className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white text-gray-400">
                      <option>Priority: Normal</option>
                    </select>
                    <button disabled className="px-4 py-2 bg-[#2d2d2d] text-white rounded text-sm font-medium">Submit</button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic mt-2">Form is interactive for tenants in their portal.</p>
              </div>
            )}

            {openRequests && openRequests.length > 0 ? (
              <div className="mt-6 space-y-3">
                {openRequests.map((req) => (
                  <div key={req.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{req.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'in_progress' ? 'In Progress' : 'Open'}
                      </span>
                    </div>
                    {req.description && <p className="text-xs text-gray-500">{req.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted {new Date(req.reported_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-4">You currently do not have any open maintenance requests.</p>
            )}
          </div>
        </div>

        {/* Closed Requests */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Closed Maintenance Requests</h2>
          {closedRequests && closedRequests.length > 0 ? (
            <div className="space-y-4">
              {closedRequests.map((req) => (
                <div key={req.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{req.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 ml-2 shrink-0">
                      COMPLETED
                    </span>
                  </div>
                  {req.description && <p className="text-xs text-gray-500 mb-1">{req.description}</p>}
                  <p className="text-xs text-gray-400">
                    Requested on {new Date(req.reported_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                  </p>
                  {req.notes && (
                    <p className="text-xs text-gray-500 mt-1">Completed: {req.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No closed requests.</p>
          )}
        </div>
      </div>
    </div>
  )
}
