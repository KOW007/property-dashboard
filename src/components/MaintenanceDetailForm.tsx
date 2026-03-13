'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
    description: request.description ?? '',
  })
  const [permissionToEnter, setPermissionToEnter] = useState<boolean | null>(request.permission_to_enter ?? null)
  const [existingPhotos, setExistingPhotos] = useState<string[]>(request.photo_urls ?? [])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]'

  const handleNewPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const combined = [...newPhotos, ...files].slice(0, Math.max(0, 5 - existingPhotos.length))
    setNewPhotos(combined)
    setNewPreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewPhoto = (index: number) => {
    const next = newPhotos.filter((_, i) => i !== index)
    setNewPhotos(next)
    setNewPreviews(next.map(f => URL.createObjectURL(f)))
  }

  const handleSave = async () => {
    setSaving(true)

    // Upload new photos
    const uploadedUrls: string[] = []
    for (let i = 0; i < newPhotos.length; i++) {
      const file = newPhotos[i]
      setUploadProgress(`Uploading photo ${i + 1} of ${newPhotos.length}...`)
      const ext = file.name.split('.').pop()
      const path = `${request.unit_id}/${Date.now()}-${i}.${ext}`
      const { data, error } = await supabase.storage
        .from('maintenance-photos')
        .upload(path, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('maintenance-photos').getPublicUrl(data.path)
        uploadedUrls.push(urlData.publicUrl)
      }
    }
    setUploadProgress('')

    const allPhotos = [...existingPhotos, ...uploadedUrls]

    await supabase
      .from('maintenance_requests')
      .update({
        status: form.status,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
        estimated_cost: form.estimated_cost !== '' ? Number(form.estimated_cost) : null,
        actual_cost: form.actual_cost !== '' ? Number(form.actual_cost) : null,
        description: form.description || null,
        notes: form.notes || null,
        completed_date: form.completed_date || null,
        permission_to_enter: permissionToEnter,
        photo_urls: allPhotos.length > 0 ? allPhotos : null,
      })
      .eq('id', request.id)

    setExistingPhotos(allPhotos)
    setNewPhotos([])
    setNewPreviews([])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" checked={permissionToEnter === true} onChange={() => setPermissionToEnter(true)} />
                Yes, may enter
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" checked={permissionToEnter === false} onChange={() => setPermissionToEnter(false)} />
                No — call to schedule
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="radio" checked={permissionToEnter === null} onChange={() => setPermissionToEnter(null)} />
                Not specified
              </label>
            </div>
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


          {/* Photos */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Photos</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingPhotos.map((url, i) => (
                <div key={i} className="relative">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                  </a>
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative">
                  <img src={src} alt={`New photo ${i + 1}`} className="w-28 h-28 object-cover rounded-lg border-2 border-dashed border-blue-300" />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ))}
            </div>
            {(existingPhotos.length + newPhotos.length) < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600"
              >
                + Add Photo(s)
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewPhotos} />
            {existingPhotos.length === 0 && newPhotos.length === 0 && (
              <p className="text-sm text-gray-400">No photos</p>
            )}
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Request</h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the issue..."
                className={inputClass}
              />
            </div>

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
                {saving ? (uploadProgress || 'Saving...') : 'Save Changes'}
              </button>
              {saved && <span className="text-green-600 text-sm">✓ Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
