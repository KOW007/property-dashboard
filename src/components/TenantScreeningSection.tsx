'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  tenantId: string
  birthdate: string | null
  ssn: string | null
  drivers_license: string | null
  drivers_license_state: string | null
  credit_report_date: string | null
  credit_score: number | null
}

const fmt = (val: string | null | undefined) => {
  if (!val) return '—'
  const d = val.includes('T') ? new Date(val) : new Date(val + 'T00:00')
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export default function TenantScreeningSection(props: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    birthdate: props.birthdate || '',
    ssn: props.ssn || '',
    drivers_license: props.drivers_license || '',
    drivers_license_state: props.drivers_license_state || '',
    credit_report_date: props.credit_report_date || '',
    credit_score: props.credit_score != null ? String(props.credit_score) : '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          birthdate: data.birthdate || null,
          ssn: data.ssn || null,
          drivers_license: data.drivers_license || null,
          drivers_license_state: data.drivers_license_state || null,
          credit_report_date: data.credit_report_date || null,
          credit_score: data.credit_score ? Number(data.credit_score) : null,
        })
        .eq('id', props.tenantId)
      if (error) throw error
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Error updating screening:', err)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const maskSSN = (ssn: string | null) => {
    if (!ssn) return '—'
    if (ssn.length >= 4) return '•••-••-' + ssn.slice(-4)
    return ssn
  }

  const maskDL = (dl: string | null) => {
    if (!dl) return '—'
    if (dl.length > 3) return '•'.repeat(dl.length - 3) + dl.slice(-3)
    return dl
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Screening</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
            <input type="date" name="birthdate" value={data.birthdate} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">SSN</label>
            <input type="text" name="ssn" value={data.ssn} onChange={handleChange} placeholder="000-00-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Drivers License</label>
            <input type="text" name="drivers_license" value={data.drivers_license} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
            <input type="text" name="drivers_license_state" value={data.drivers_license_state} onChange={handleChange}
              maxLength={2} placeholder="TX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Credit Report Date</label>
            <input type="date" name="credit_report_date" value={data.credit_report_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Credit Score</label>
            <input type="number" name="credit_score" value={data.credit_score} onChange={handleChange}
              min={300} max={850} placeholder="750"
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Screening</h2>
        <button onClick={() => setEditing(true)}
          className="text-xs text-[#b22625] hover:underline font-medium">
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Date of Birth</p>
          <p className="text-gray-900 font-medium mt-1">{fmt(props.birthdate)}</p>
        </div>
        <div>
          <p className="text-gray-500">SSN</p>
          <p className="text-gray-900 font-medium mt-1">{maskSSN(props.ssn)}</p>
        </div>
        <div>
          <p className="text-gray-500">Drivers License</p>
          <p className="text-gray-900 font-medium mt-1">{maskDL(props.drivers_license)}</p>
        </div>
        <div>
          <p className="text-gray-500">State</p>
          <p className="text-gray-900 font-medium mt-1">{props.drivers_license_state || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">Credit Report Date</p>
          <p className="text-gray-900 font-medium mt-1">{fmt(props.credit_report_date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Credit Score</p>
          <p className="text-gray-900 font-medium mt-1">{props.credit_score ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
