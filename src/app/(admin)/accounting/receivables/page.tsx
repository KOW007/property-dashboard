import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReceivablesPage({ searchParams }: { searchParams: Promise<{ tab?: string; property?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const tab = params.tab || 'receipt'
  const propertyFilter = params.property

  let query = supabase
    .from('receivables_view')
    .select('*')
    .eq('type', tab)
    .order('date', { ascending: false })

  if (propertyFilter) {
    query = query.eq('property_name', propertyFilter)
  }

  const { data: items } = await query

  const totalAmount = items?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0
  const properties = [...new Set(items?.map(i => i.property_name).filter(Boolean))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Receivables</h2>
        <div className="flex gap-2">
          <Link href="/accounting/receivables/new?type=receipt" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            + New Receipt
          </Link>
          <Link href="/accounting/receivables/new?type=charge" className="bg-[#b22625] text-white px-4 py-2 rounded-lg hover:bg-[#8a1d1c] text-sm">
            + New Charge
          </Link>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/accounting/receivables?tab=receipt"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'receipt' ? 'bg-[#b22625] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow'}`}
        >
          Receipts
        </Link>
        <Link
          href="/accounting/receivables?tab=charge"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'charge' ? 'bg-[#b22625] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 shadow'}`}
        >
          Charges
        </Link>
      </div>

      {/* Property Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Property</label>
          <div className="flex gap-2">
            {propertyFilter ? (
              <>
                <span className="text-sm font-medium text-gray-900">{propertyFilter}</span>
                <Link href={`/accounting/receivables?tab=${tab}`} className="text-red-500 text-xs hover:underline">clear</Link>
              </>
            ) : (
              <div className="flex flex-wrap gap-1">
                {properties.map(p => (
                  <Link key={p} href={`/accounting/receivables?tab=${tab}&property=${encodeURIComponent(p)}`} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">{p}</Link>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-green-600">${totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property - Unit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items && items.length > 0 ? (
              items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.date ? new Date(item.date + 'T00:00').toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.payer || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.gl_account_display || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.property_name}{item.unit_number ? ` - ${item.unit_number}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    ${Number(item.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reference || '—'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No {tab === 'receipt' ? 'receipts' : 'charges'} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
