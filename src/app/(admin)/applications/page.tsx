import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import ApplicationActions from '@/components/ApplicationActions'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPage() {
  const supabase = await createSupabaseServer()

  const { data: applications } = await supabase
    .from('tenant_applications')
    .select('*')
    .order('created_at', { ascending: false })

  const total = applications?.length || 0
  const pending = applications?.filter(a => a.status === 'pending').length || 0
  const approved = applications?.filter(a => a.status === 'approved').length || 0
  const denied = applications?.filter(a => a.status === 'denied').length || 0
  const waitlist = applications?.filter(a => a.status === 'waitlist').length || 0

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Tenant Applications</h1>
            <p className="text-gray-600 mt-2">Review and manage rental applications</p>
          </div>
          <Link
            href="/apply"
            className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]"
          >
            New Application
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900">{total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">{pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500 mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-600">{approved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500 mb-1">Denied</div>
            <div className="text-3xl font-bold text-red-600">{denied}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-sm text-gray-500 mb-1">Waitlist</div>
            <div className="text-3xl font-bold text-blue-600">{waitlist}</div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screening</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications && applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.first_name} {app.last_name}</div>
                      <div className="text-xs text-gray-500">{app.email}</div>
                      <div className="text-xs text-gray-500">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{app.employer_name || 'N/A'}</div>
                      <div className="text-xs text-gray-400">{app.job_title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ${Number(app.monthly_income || 0).toLocaleString()}/mo
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-y-1">
                      {app.ever_evicted && <div className="text-red-600 text-xs">⚠️ Eviction</div>}
                      {app.ever_convicted && <div className="text-red-600 text-xs">⚠️ Criminal</div>}
                      {app.has_pets && <div className="text-yellow-600 text-xs">🐾 Pets</div>}
                      {app.is_smoker && <div className="text-gray-500 text-xs">🚬 Smoker</div>}
                      {!app.ever_evicted && !app.ever_convicted && !app.has_pets && !app.is_smoker && (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://apply.rentspree.com/?email=${encodeURIComponent(app.email || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-[#2d2d2d] text-white px-2 py-1 rounded hover:bg-black"
                      >
                        🔍 Screen
                      </a>
                      {app.background_check_status && (
                        <div className={`text-xs mt-1 font-medium ${
                          app.background_check_status === 'clear' ? 'text-green-600' :
                          app.background_check_status === 'flagged' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {app.background_check_status}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'denied' ? 'bg-red-100 text-red-800' :
                        app.status === 'waitlist' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pending Application Cards */}
        {pending > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Review ({pending})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications?.filter(a => a.status === 'pending').map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{app.first_name} {app.last_name}</h3>
                      <p className="text-sm text-gray-500">{app.email} · {app.phone}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Applied:</span>{' '}
                      <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Income:</span>{' '}
                      <span className="font-medium text-green-600">${Number(app.monthly_income || 0).toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Employer:</span>{' '}
                      <span className="font-medium">{app.employer_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Job Title:</span>{' '}
                      <span className="font-medium">{app.job_title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current City:</span>{' '}
                      <span className="font-medium">{app.current_city || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Pets:</span>{' '}
                      <span className="font-medium">{app.has_pets ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {/* Flags */}
                  {(app.ever_evicted || app.ever_convicted || app.bankruptcy_filed) && (
                    <div className="bg-red-50 rounded p-2 mb-3 text-xs space-y-1">
                      {app.ever_evicted && <div className="text-red-700">⚠️ Previous eviction: {app.eviction_details}</div>}
                      {app.ever_convicted && <div className="text-red-700">⚠️ Criminal history: {app.conviction_details}</div>}
                      {app.bankruptcy_filed && <div className="text-red-700">⚠️ Bankruptcy filed: {app.bankruptcy_details}</div>}
                    </div>
                  )}

                  {/* Review Notes */}
                  {app.review_notes && (
                    <div className="bg-gray-50 rounded p-2 mb-3 text-xs text-gray-600">
                      📝 {app.review_notes}
                    </div>
                  )}

                  <ApplicationActions appId={app.id} currentStatus={app.status} email={app.email} backgroundCheckStatus={app.background_check_status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
