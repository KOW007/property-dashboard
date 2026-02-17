import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BankTransfersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const statusFilter = params.status || 'incomplete'

  const { data: transfers } = await supabase
    .from('bank_transfers_view')
    .select('*')
    .eq('status', statusFilter)
    .order('transfer_date', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Bank Transfers</h2>
        <Link href="/accounting/bank-transfers/new" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
          + New Transfer
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 items-center">
        <span className="text-xs text-gray-500 mr-2">Status:</span>
        <Link
          href="/accounting/bank-transfers?status=incomplete"
          className={`px-3 py-1.5 rounded text-xs font-medium border ${statusFilter === 'incomplete' ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          Incomplete
        </Link>
        <Link
          href="/accounting/bank-transfers?status=completed"
          className={`px-3 py-1.5 rounded text-xs font-medium border ${statusFilter === 'completed' ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          Completed
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transfers && transfers.length > 0 ? (
              transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{t.from_account_name || '—'}</div>
                    {t.from_property_name && <div className="text-xs text-gray-500">{t.from_property_name}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{t.to_account_name || '—'}</div>
                    {t.to_property_name && <div className="text-xs text-gray-500">{t.to_property_name}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.description || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.status === 'completed' ? 'COMPLETED' : 'INCOMPLETE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    ${Number(t.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No {statusFilter} transfers found</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
          Displaying {transfers?.length || 0} transfers
        </div>
      </div>
    </div>
  )
}
