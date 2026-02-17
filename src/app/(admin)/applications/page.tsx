import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ApplicationsReportPage() {
  const supabase = await createSupabaseServer()
  // Fetch all applications
  const { data: applications } = await supabase
    .from('applications_summary')
    .select('*')
    .order('application_date', { ascending: false })

  // Count by status
  const pending = applications?.filter(a => a.status === 'pending').length || 0
  const approved = applications?.filter(a => a.status === 'approved').length || 0
  const denied = applications?.filter(a => a.status === 'denied').length || 0

  // Flagged applications
  const { data: flagged } = await supabase
    .from('flagged_applications')
    .select('*')

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
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Total Applications</div>
            <div className="text-3xl font-bold text-gray-900">{applications?.length || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Pending Review</div>
            <div className="text-3xl font-bold text-[#b22625]">{pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-600">{approved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500 mb-1">Flagged</div>
            <div className="text-3xl font-bold text-[#b22625]">{flagged?.length || 0}</div>
          </div>
        </div>

        {/* Flagged Applications Alert */}
        {flagged && flagged.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-[#8a1d1c] font-semibold mb-2">⚠️ Flagged Applications</h3>
            <div className="space-y-2">
              {flagged.map((app, idx) => (
                <div key={idx} className="text-sm text-[#8a1d1c]">
                  <span className="font-medium">{app.applicant_name}</span> - {app.flag_reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Property/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Credit Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Flags
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications && applications.length > 0 ? (
                applications.map((app, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.applicant_name}</div>
                      <div className="text-xs text-gray-500">{app.email}</div>
                      <div className="text-xs text-gray-500">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.property_name && (
                        <div>
                          <div>{app.property_name}</div>
                          {app.unit_number && <div className="text-xs">Unit {app.unit_number}</div>}
                        </div>
                      )}
                      {!app.property_name && <span className="text-gray-400">General Application</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.application_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-green-600">
                        ${Number(app.monthly_income || 0).toLocaleString()}/mo
                      </div>
                      {app.current_monthly_rent && (
                        <div className="text-xs text-gray-500">
                          Current: ${Number(app.current_monthly_rent).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.credit_score ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.credit_score >= 700 ? 'bg-green-100 text-green-800' :
                          app.credit_score >= 600 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-[#8a1d1c]'
                        }`}>
                          {app.credit_score}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not checked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'denied' ? 'bg-red-100 text-[#8a1d1c]' :
                        app.status === 'pending' ? 'bg-red-50 text-[#8a1d1c]' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        {app.ever_evicted && (
                          <div className="text-[#b22625] text-xs">⚠️ Eviction</div>
                        )}
                        {app.ever_convicted && (
                          <div className="text-[#b22625] text-xs">⚠️ Criminal</div>
                        )}
                        {app.has_pets && (
                          <div className="text-[#b22625] text-xs">🐾 Pets</div>
                        )}
                        {app.is_smoker && (
                          <div className="text-gray-600 text-xs">🚬 Smoker</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Application Details Cards (Alternative view) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications?.filter(a => a.status === 'pending').map((app, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{app.applicant_name}</h3>
                    <p className="text-sm text-gray-600">{app.email}</p>
                  </div>
                  <span className="inline-block bg-red-50 text-[#8a1d1c] px-3 py-1 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applied:</span>
                    <span className="font-medium">{new Date(app.application_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="font-medium text-green-600">
                      ${Number(app.monthly_income || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employer:</span>
                    <span className="font-medium">{app.employer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">References:</span>
                    <span className="font-medium">{app.reference_count}</span>
                  </div>
                  {app.credit_score && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Score:</span>
                      <span className={`font-medium ${
                        app.credit_score >= 700 ? 'text-green-600' :
                        app.credit_score >= 600 ? 'text-yellow-600' :
                        'text-[#b22625]'
                      }`}>
                        {app.credit_score}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                    Approve
                  </button>
                  <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                    Deny
                  </button>
                  <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
