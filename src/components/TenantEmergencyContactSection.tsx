'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  tenantId: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

export default function TenantEmergencyContactSection(props: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    emergency_contact_name: props.emergency_contact_name || '',
    emergency_contact_phone: props.emergency_contact_phone || '',
    emergency_contact_relationship: props.emergency_contact_relationship || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          emergency_contact_relationship: data.emergency_contact_relationship || null,
        })
        .eq('id', props.tenantId)
      if (error) throw error
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Error updating emergency contact:', err)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input type="text" name="emergency_contact_name" value={data.emergency_contact_name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input type="text" name="emergency_contact_phone" value={data.emergency_contact_phone} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Relationship</label>
            <input type="text" name="emergency_contact_relationship" value={data.emergency_contact_relationship} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Emergency Contact</h2>
        <button onClick={() => setEditing(true)}
          className="text-xs text-[#b22625] hover:underline font-medium">
          Edit
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Name</p>
          <p className="text-gray-900 font-medium mt-1">{props.emergency_contact_name || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Phone</p>
          <p className="text-gray-900 font-medium mt-1">{props.emergency_contact_phone || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Relationship</p>
          <p className="text-gray-900 font-medium mt-1">{props.emergency_contact_relationship || '—'}</p>
        </div>
      </div>
    </div>
  )
}
