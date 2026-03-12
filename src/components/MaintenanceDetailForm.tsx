'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-[#8a1d1c]',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
}

type Props = {
  request: any
  unit: { unit_number: string } | null
  property: { name: string; address: string; city: string; state: string; zip: string } | null
  tenant: { first_name: string; last_name: string; email?: string; phone?: string } | null
}

export default function MaintenanceDetailForm({ request, unit, property, tenant }: Props) {
  const [form, setForm] = useState({
    status: request.status ?? 'open',
    priority: request.priority ?? 'medium',
    assigned_to: request.assigned_to ?? '',
    estimated_cost: request.estimated_cost ?? '',
    actual_cost: request.actual_cost ?? '',
    notes: request.notes ?? '',
    completed_date: request.completed_date ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const photos: string[] = request.photo_urls ?? []
  const permissionToEnter: boolean | null = request.permission_to_enter ?? null

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]'

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('maintenance_requests')
      .update({
        status: form.status,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
        estimated_cost: form.estimated_cost !== '' ? Number(form.estimated_cost) : null,
        actual_cost: form.actual_cost !== '' ? Number(form.actual_cost) : null,
        notes: form.notes || null,
        completed_date: form.completed_date || null,
      })
      .eq('id', request.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/work-orders" className="text-[#b22625] hover:text-[#8a1d1c] text-sm">
          ← Back to Maintenance
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{request.title}</h1>
        <div className="flex gap-2 mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[request.priority] ?? 'bg-gray-100 text-gray-800'}`}>
            {request.priority}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status] ?? 'bg-gray-100 text-gray-800'}`}>
            {request.status?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Read-only details */}
        <div className="md:col-span-1 space-y-4">

          {/* Property / Unit */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</h2>
            {property ? (
              <>
                <p className="font-medium text-gray-900">{property.name}</p>
                <p className="text-sm text-gray-600">Unit {unit?.unit_number}</p>
                <p className="text-sm text-gray-500 mt-1">{property.address}</p>
                <p className="text-sm text-gray-500">{property.city}, {property.state} {property.zip}</p>
              </>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>

          {/* Tenant */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tenant</h2>
            {tenant ? (
              <>
                <p className="font-medium text-gray-900">{tenant.first_name} {tenant.last_name}</p>
                {tenant.email && <p className="text-sm text-gray-500">{tenant.email}</p>}
                {tenant.phone && <p className="text-sm text-gray-500">{tenant.phone}</p>}
              </>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>

          {/* Permission to Enter */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permission to Enter</h2>
            {permissionToEnter === true && (
              <p className="text-sm text-green-700 font-medium">✓ Yes, may enter</p>
            )}
            {permissionToEnter === false && (
              <p className="text-sm text-red-700 font-medium">✗ No — call to schedule</p>
            )}
            {permissionToEnter === null && (
              <p className="text-sm text-gray-400">Not specified</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dates</h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Reported:</span>{' '}
              {request.reported_date ? new Date(request.reported_date).toLocaleDateString() : '—'}
            </p>
            {request.completed_date && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Completed:</span>{' '}
                {new Date(request.completed_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Right: Details + Edit */}
        <div className="md:col-span-2 space-y-4">

          {/* Description */}
          {request.description && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Photos</h2>
              <div className="flex flex-wrap gap-3">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-28 h-28 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Editable fields */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Request</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={inputClass}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
              <input
                type="text"
                value={form.assigned_to}
                onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                placeholder="Vendor or staff name"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.estimated_cost}
                    onChange={e => setForm(p => ({ ...p, estimated_cost: e.target.value }))}
                    placeholder="0.00"
                    className={`${inputClass} pl-6`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Actual Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.actual_cost}
                    onChange={e => setForm(p => ({ ...p, actual_cost: e.target.value }))}
                    placeholder="0.00"
                    className={`${inputClass} pl-6`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date Completed</label>
              <input
                type="date"
                value={form.completed_date}
                onChange={e => setForm(p => ({ ...p, completed_date: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Internal Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Notes visible only to admin..."
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c] disabled:bg-gray-400 font-medium text-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span className="text-green-600 text-sm">✓ Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
