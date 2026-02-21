import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MaintenanceRequestForm from '@/components/MaintenanceRequestForm'

export const dynamic = 'force-dynamic'

export default async function PortalMaintenancePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, unit_id')
    .eq('email', user.email)
    .single()

  // Open requests
  const { data: openRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date')
    .eq('unit_id', tenant?.unit_id)
    .in('status', ['open', 'in_progress'])
    .order('reported_date', { ascending: false })

  // Closed requests
  const { data: closedRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, status, priority, reported_date, notes')
    .eq('unit_id', tenant?.unit_id)
    .in('status', ['completed', 'cancelled'])
    .order('reported_date', { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Maintenance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Requests + Submit Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Maintenance Requests</h2>
            {tenant && <MaintenanceRequestForm unitId={tenant.unit_id} tenantId={tenant.id} />}

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
                    <p className="text-xs text-gray-500">{req.description}</p>
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
                  <p className="text-xs text-gray-500 mb-1">{req.description}</p>
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
