'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  tenantId: string
  status: string | null
  move_in_date: string | null
  move_out_date: string | null
  notice_date: string | null
  move_out_reason: string | null
  send_rent_reminders: boolean | null
  unitId: string | null
  unitNumber: string | null
  currentTenantUnitIds: string[]
}

const fmt = (val: string | null | undefined) => {
  if (!val) return '—'
  const d = val.includes('T') ? new Date(val) : new Date(val + 'T00:00')
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export default function TenantStatusSection(props: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    status: props.status || 'Current',
    move_in_date: props.move_in_date || '',
    move_out_date: props.move_out_date || '',
    notice_date: props.notice_date || '',
    move_out_reason: props.move_out_reason || '',
    send_rent_reminders: props.send_rent_reminders ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSave = async () => {
    // Warn if activating a tenant whose unit already has a Current tenant
    if (
      data.status === 'Current' &&
      props.status !== 'Current' &&
      props.unitId &&
      props.currentTenantUnitIds.includes(props.unitId)
    ) {
      const confirmed = window.confirm(
        `There is already a current tenant in Unit ${props.unitNumber ?? props.unitId}. Are you sure you want to set this tenant to Current?`
      )
      if (!confirmed) return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          status: data.status || null,
          move_in_date: data.move_in_date || null,
          move_out_date: data.move_out_date || null,
          notice_date: data.notice_date || null,
          move_out_reason: data.move_out_reason || null,
          send_rent_reminders: data.send_rent_reminders,
        })
        .eq('id', props.tenantId)
      if (error) throw error
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tenant Status</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select name="status" value={data.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="Current">Current</option>
              <option value="Future">Future</option>
              <option value="Notice-Unrented">Notice-Unrented</option>
              <option value="Notice-Rented">Notice-Rented</option>
              <option value="Past">Past</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Move In</label>
            <input type="date" name="move_in_date" value={data.move_in_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Move Out</label>
            <input type="date" name="move_out_date" value={data.move_out_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notice</label>
            <input type="date" name="notice_date" value={data.notice_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Move Out Reason</label>
            <input type="text" name="move_out_reason" value={data.move_out_reason} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" name="send_rent_reminders" checked={data.send_rent_reminders}
              onChange={handleChange} className="h-4 w-4 text-[#b22625] rounded border-gray-300" />
            <label className="text-xs font-medium text-gray-500">Send Rent Reminders</label>
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tenant Status</h2>
        <button onClick={() => setEditing(true)}
          className="text-xs text-[#b22625] hover:underline font-medium">
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Status</p>
          <p className="text-gray-900 font-medium mt-1">{props.status || 'Current'}</p>
        </div>
        <div>
          <p className="text-gray-500">Move In</p>
          <p className="text-gray-900 font-medium mt-1">{fmt(props.move_in_date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Move Out</p>
          <p className="text-gray-900 font-medium mt-1">{fmt(props.move_out_date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Notice</p>
          <p className="text-gray-900 font-medium mt-1">{fmt(props.notice_date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Move Out Reason</p>
          <p className="text-gray-900 font-medium mt-1">{props.move_out_reason || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Send Rent Reminders</p>
          <p className="text-gray-900 font-medium mt-1">{props.send_rent_reminders === false ? 'No' : 'Yes'}</p>
        </div>
      </div>
    </div>
  )
}
