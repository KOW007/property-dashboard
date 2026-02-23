import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PayablesPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string; property?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const tab = params.tab || 'bill'
  const statusFilter = params.status
  const propertyFilter = params.property

  let query = supabase
    .from('payables_view')
    .select('*')
    .eq('type', tab)
    .order('bill_date', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (propertyFilter) {
    query = query.eq('property_name', propertyFilter)
  }

  const { data: items } = await query

  const totalAmount = items?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending Approval', value: 'pending_approval' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Approved', value: 'approved' },
  ]

  const statusColors: Record<string, string> = {
    'unpaid': 'bg-red-100 text-red-800',
    'paid': 'bg-green-100 text-green-800',
    'pending_approval': 'bg-yellow-100 text-yellow-800',
    'on_hold': 'bg-gray-100 text-gray-800',
    'approved': 'bg-red-100 text-[#8a1d1c]',
  }

  const statusLabels: Record<string, string> = {
    'unpaid': 'Unpaid',
    'paid': 'Paid',
    'pending_approval': 'Pending Approval',
    'on_hold': 'On Hold',
    'approved': 'Approved',
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const t = overrides.tab ?? tab
    const s = overrides.status ?? statusFilter ?? ''
    const pr = overrides.property ?? propertyFilter ?? ''
    if (t) p.set('tab', t)
    if (s) p.set('status', s)
    if (pr) p.set('property', pr)
    const qs = p.toString()
    return `/accounting/payables${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Payables</h2>
        <div className="flex gap-2">
          <Link href="/accounting/payables/new?type=bill" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            + Enter Bill
          </Link>
          <Link href="/accounting/payables/new?type=payment" className="bg-[#b22625] text-white px-4 py-2 rounded-lg hover:bg-[#8a1d1c] text-sm">
            + Record Payment
          </Link>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <Link
          href={buildUrl({ tab: 'bill', status: '' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'bill' ? 'bg-[#b22625] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow'}`}
        >
          Bills
        </Link>
        <Link
          href={buildUrl({ tab: 'payment', status: '' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'payment' ? 'bg-[#b22625] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow'}`}
        >
          Payments
        </Link>
      </div>

      {/* Status Filter Tabs */}
      {tab === 'bill' && (
        <div className="flex gap-1 mb-6">
          {statusTabs.map(st => (
            <Link
              key={st.value}
              href={buildUrl({ status: st.value })}
              className={`px-3 py-1.5 rounded text-xs font-medium border ${
                (statusFilter || '') === st.value
                  ? 'bg-red-50 border-red-300 text-[#8a1d1c]'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {st.label}
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
        <span className="text-sm text-gray-500">Displaying {items?.length || 0} {tab === 'bill' ? 'bills' : 'payments'}</span>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-green-600">${totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">For</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Account</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items && items.length > 0 ? (
              items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.payee}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.ref_number || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.bill_date ? new Date(item.bill_date + 'T00:00').toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.property_name}{item.unit_number ? ` - ${item.unit_number}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.gl_account_display || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.due_date ? new Date(item.due_date + 'T00:00').toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    ${Number(item.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.cash_account_display || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  No {tab === 'bill' ? 'bills' : 'payments'} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
