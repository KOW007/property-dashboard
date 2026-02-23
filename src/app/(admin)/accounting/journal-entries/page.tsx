import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function JournalEntriesPage({ searchParams }: { searchParams: Promise<{ property?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const propertyFilter = params.property

  let query = supabase
    .from('journal_entries_view')
    .select('*')
    .order('entry_date', { ascending: false })

  if (propertyFilter) {
    query = query.eq('property_name', propertyFilter)
  }

  const { data: entries } = await query

  // Get line totals for each entry
  const entryIds = entries?.map(e => e.id) || []
  let lines: any[] = []
  if (entryIds.length > 0) {
    const { data } = await supabase
      .from('journal_entry_lines')
      .select('journal_entry_id, debit, credit')
      .in('journal_entry_id', entryIds)
    lines = data || []
  }

  const entryTotals = entryIds.reduce((acc, id) => {
    const entryLines = lines.filter(l => l.journal_entry_id === id)
    acc[id] = {
      debit: entryLines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0),
      credit: entryLines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0),
    }
    return acc
  }, {} as Record<string, { debit: number; credit: number }>)

  const properties = [...new Set(entries?.map(e => e.property_name).filter(Boolean))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Journal Entries</h2>
        <Link href="/accounting/journal-entries/new" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
          + New Journal Entry
        </Link>
      </div>

      {/* Property Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-2 items-center flex-wrap">
        <span className="text-xs text-gray-500 mr-2">Property:</span>
        <Link
          href="/accounting/journal-entries"
          className={`px-3 py-1.5 rounded text-xs font-medium border ${!propertyFilter ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </Link>
        {properties.map(p => (
          <Link
            key={p}
            href={`/accounting/journal-entries?property=${encodeURIComponent(p)}`}
            className={`px-3 py-1.5 rounded text-xs font-medium border ${propertyFilter === p ? 'bg-red-50 border-red-300 text-[#8a1d1c]' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {p}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries && entries.length > 0 ? (
              entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {e.entry_date ? new Date(e.entry_date + 'T00:00').toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.reference_number || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.property_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{e.description || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    ${(entryTotals[e.id]?.debit || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    ${(entryTotals[e.id]?.credit || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No journal entries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
