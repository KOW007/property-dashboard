import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<{ property?: string; status?: string; assigned_to?: string }> }) {
  const supabase = await createSupabaseServer()
  const params = await searchParams
  const propertyFilter = params.property
  const statusFilter = params.status
  const assignedFilter = params.assigned_to

  // Fetch work orders
  let query = supabase
    .from('work_orders_view')
    .select('*')
    .order('created_at', { ascending: false })

  if (propertyFilter) {
    query = query.eq('property_name', propertyFilter)
  }
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (assignedFilter) {
    query = query.eq('assigned_to', assignedFilter)
  }

  const { data: workOrders } = await query

  // Get unique values for filter dropdowns
  const properties = [...new Set(workOrders?.map(wo => wo.property_name).filter(Boolean))]
  const assignees = [...new Set(workOrders?.map(wo => wo.assigned_to).filter(Boolean))]

  // Status counts
  const statuses = ['open', 'in_progress', 'completed', 'cancelled']
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = workOrders?.filter(wo => wo.status === s).length || 0
    return acc
  }, {} as Record<string, number>)

  const statusColors: Record<string, string> = {
    'open': 'bg-red-100 text-[#8a1d1c]',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-gray-100 text-gray-800',
  }

  const statusLabels: Record<string, string> = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  }

  const priorityColors: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'emergency': 'bg-red-100 text-red-800',
  }

  // Build filter URL helper
  function filterUrl(key: string, value: string) {
    const p = new URLSearchParams()
    if (key === 'property' && value) p.set('property', value)
    else if (propertyFilter) p.set('property', propertyFilter)
    if (key === 'status' && value) p.set('status', value)
    else if (statusFilter) p.set('status', statusFilter)
    if (key === 'assigned_to' && value) p.set('assigned_to', value)
    else if (assignedFilter) p.set('assigned_to', assignedFilter)
    const qs = p.toString()
    return `/work-orders${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>

            <h1 className="text-4xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-2">Maintenance requests and work orders</p>
          </div>
          <Link
            href="/work-orders/new"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            + New Work Order
          </Link>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {statuses.map(s => (
            <Link
              key={s}
              href={statusFilter === s ? '/work-orders' : filterUrl('status', s)}
              className={`bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-shadow ${statusFilter === s ? 'ring-2 ring-[#b22625]' : ''}`}
            >
              <div className="text-2xl font-bold text-gray-900">{statusCounts[s]}</div>
              <div className="text-sm text-gray-500">{statusLabels[s]}</div>
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Property</label>
            <div className="flex gap-2">
              {propertyFilter ? (
                <>
                  <span className="text-sm font-medium text-gray-900">{propertyFilter}</span>
                  <Link href={filterUrl('property', '')} className="text-red-500 text-xs hover:underline">clear</Link>
                </>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {properties.map(p => (
                    <Link key={p} href={filterUrl('property', p)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">{p}</Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border-l border-gray-200 pl-4">
            <label className="text-xs text-gray-500 block mb-1">Assigned To</label>
            <div className="flex gap-2">
              {assignedFilter ? (
                <>
                  <span className="text-sm font-medium text-gray-900">{assignedFilter}</span>
                  <Link href={filterUrl('assigned_to', '')} className="text-red-500 text-xs hover:underline">clear</Link>
                </>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {assignees.map(a => (
                    <Link key={a} href={filterUrl('assigned_to', a)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">{a}</Link>
                  ))}
                  {assignees.length === 0 && <span className="text-xs text-gray-400">None</span>}
                </div>
              )}
            </div>
          </div>
          {(propertyFilter || statusFilter || assignedFilter) && (
            <Link href="/work-orders" className="ml-auto text-sm text-[#b22625] hover:underline">Reset Filters</Link>
          )}
        </div>

        {/* Work Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workOrders && workOrders.length > 0 ? (
                workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{wo.property_name}</div>
                      <div className="text-gray-500">Unit {wo.unit_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {wo.tenant_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="font-medium">{wo.title}</div>
                      {wo.description && (
                        <div className="text-gray-500 truncate max-w-xs">{wo.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {wo.assigned_to || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[wo.priority] || 'bg-gray-100 text-gray-800'}`}>
                        {wo.priority || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[wo.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[wo.status] || wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wo.created_at ? new Date(wo.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No work orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
