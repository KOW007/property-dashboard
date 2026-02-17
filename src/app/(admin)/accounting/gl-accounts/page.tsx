import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GLAccountsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const typeFilter = params.type

  let query = supabase
    .from('gl_accounts')
    .select('*')
    .order('account_number')

  if (typeFilter) {
    query = query.eq('account_type', typeFilter)
  }

  const { data: accounts } = await query

  const filtered = accounts

  const types = ['Cash', 'Asset', 'Liability', 'Capital', 'Income', 'Expense', 'Other Expense']

  const typeColors: Record<string, string> = {
    'Cash': 'bg-green-100 text-green-800',
    'Asset': 'bg-red-100 text-[#8a1d1c]',
    'Liability': 'bg-red-100 text-red-800',
    'Capital': 'bg-purple-100 text-purple-800',
    'Income': 'bg-teal-100 text-teal-800',
    'Expense': 'bg-orange-100 text-orange-800',
    'Other Expense': 'bg-gray-100 text-gray-800',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Chart of Accounts</h2>
        <Link
          href="/accounting/gl-accounts/new"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          + New GL Account
        </Link>
      </div>

      {/* Type Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 items-center flex-wrap">
        <span className="text-xs text-gray-500 mr-2">Filter by type:</span>
        <Link
          href="/accounting/gl-accounts"
          className={`px-3 py-1.5 rounded text-xs font-medium border ${!typeFilter ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </Link>
        {types.map(t => (
          <Link
            key={t}
            href={`/accounting/gl-accounts?type=${encodeURIComponent(t)}`}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${typeFilter === t ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered && filtered.length > 0 ? (
              filtered.map(account => (
                <tr key={account.id} className={`hover:bg-gray-50 ${account.parent_account_number ? 'pl-8' : ''}`}>
                  <td className="px-6 py-3 text-sm">
                    <span className={account.parent_account_number ? 'ml-6 text-gray-600' : 'font-medium text-[#b22625]'}>
                      {account.account_number}: {account.account_name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[account.account_type] || 'bg-gray-100 text-gray-800'}`}>
                      {account.account_type}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">No accounts found</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
          Displaying {filtered?.length || 0} accounts
        </div>
      </div>
    </div>
  )
}
