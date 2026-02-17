import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function OnlinePaymentsPage() {
  const supabase = await createSupabaseServer()
  const { data: accounts } = await supabase
    .from('bank_accounts_view')
    .select('*')
    .order('account_name')

  const enabled = accounts?.filter(a => a.payments_enabled) || []
  const disabled = accounts?.filter(a => !a.payments_enabled) || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Online Payments</h2>
      </div>

      {/* Info Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-[#8a1d1c]">
          Manage online payment settings for your bank accounts. Enable payments to allow tenants to pay rent online.
        </p>
      </div>

      {/* Enabled Accounts */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment-Enabled Accounts ({enabled.length})</h3>
        {enabled.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enabled.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.account_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.bank_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.property_name || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      ${Number(a.balance || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No accounts have payments enabled yet.
          </div>
        )}
      </div>

      {/* Disabled Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts Awaiting Setup ({disabled.length})</h3>
        {disabled.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disabled.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.account_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.bank_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{a.property_name || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        NOT ENABLED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            All accounts have payments enabled.
          </div>
        )}
      </div>
    </div>
  )
}
