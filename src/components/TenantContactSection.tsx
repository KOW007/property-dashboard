'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  tenantId: string
  email: string | null
  phone: string | null
  license_plates: string | null
  pets: string | null
  is_primary_tenant: boolean | null
}

export default function TenantContactSection(props: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    email: props.email || '',
    phone: props.phone || '',
    license_plates: props.license_plates || '',
    pets: props.pets || '',
    is_primary_tenant: props.is_primary_tenant ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          email: data.email || null,
          phone: data.phone || null,
          license_plates: data.license_plates || null,
          pets: data.pets || null,
          is_primary_tenant: data.is_primary_tenant,
        })
        .eq('id', props.tenantId)
      if (error) throw error
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Error updating contact:', err)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input type="email" name="email" value={data.email} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input type="text" name="phone" value={data.phone} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">License Plates</label>
            <input type="text" name="license_plates" value={data.license_plates} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pets</label>
            <input type="text" name="pets" value={data.pets} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_primary_tenant" checked={data.is_primary_tenant}
              onChange={handleChange} className="h-4 w-4 text-[#b22625] rounded border-gray-300" />
            <label className="text-xs font-medium text-gray-500">Primary Tenant</label>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} disabled={saving}
            className="bg-[#b22625] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#8a1d1c] disabled:bg-gray-400">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h2>
        <button onClick={() => setEditing(true)}
          className="text-xs text-[#b22625] hover:underline font-medium">
          Edit
        </button>
      </div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Email</dt>
          <dd className="text-gray-900 font-medium">{props.email || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Phone</dt>
          <dd className="text-gray-900 font-medium">{props.phone || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">License Plates</dt>
          <dd className="text-gray-900 font-medium">{props.license_plates || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Pets</dt>
          <dd className="text-gray-900 font-medium">{props.pets || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Primary Tenant</dt>
          <dd className="text-gray-900 font-medium">{props.is_primary_tenant ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </div>
  )
}
