'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UnitOption {
  id: string
  unit_number: string | null
  property_name: string
}

interface Props {
  leaseId: string | null
  unitId: string | null
  allUnits: UnitOption[]
  occupiedUnitIds: string[]
  monthly_rent: number | null
  security_deposit: number | null
  start_date: string | null
  end_date: string | null
  move_in_date: string | null
  last_lease_renewal: string | null
  next_rent_increase_date: string | null
  tenant_tags: string | null
  lease_status: string | null
  notes: string | null
}

const LEASE_STATUS_OPTIONS = [
  'Draft',
  'Out for Signing',
  'Fully Executed',
]

const fmt = (val: string | null | undefined) => {
  if (!val) return '—'
  const d = val.includes('T') ? new Date(val) : new Date(val + 'T00:00')
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

const fmtMoney = (val: number | null | undefined) =>
  val != null ? `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'

export default function TenantLeaseSection(props: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    unit_id: props.unitId || '',
    monthly_rent: props.monthly_rent?.toString() || '',
    security_deposit: props.security_deposit?.toString() || '',
    start_date: props.start_date || '',
    end_date: props.end_date || '',
    move_in_date: props.move_in_date || '',
    last_lease_renewal: props.last_lease_renewal || '',
    next_rent_increase_date: props.next_rent_increase_date || '',
    tenant_tags: props.tenant_tags || '',
    lease_status: props.lease_status || 'Draft',
    notes: props.notes || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!props.leaseId) return

    // Warn if the selected unit is already occupied by another tenant
    if (data.unit_id && data.unit_id !== props.unitId && props.occupiedUnitIds.includes(data.unit_id)) {
      const selected = props.allUnits.find(u => u.id === data.unit_id)
      const label = selected ? `Unit ${selected.unit_number}` : 'this unit'
      const confirmed = window.confirm(
        `There is already a current tenant in ${label}. Are you sure you want to assign this tenant to the same unit?`
      )
      if (!confirmed) return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('leases')
        .update({
          unit_id: data.unit_id || null,
          monthly_rent: data.monthly_rent ? parseFloat(data.monthly_rent) : null,
          security_deposit: data.security_deposit ? parseFloat(data.security_deposit) : null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          move_in_date: data.move_in_date || null,
          last_lease_renewal: data.last_lease_renewal || null,
          next_rent_increase_date: data.next_rent_increase_date || null,
          tenant_tags: data.tenant_tags || null,
          lease_status: data.lease_status || null,
          notes: data.notes || null,
        })
        .eq('id', props.leaseId)
      if (error) throw error
      setEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Error updating lease:', err)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!props.leaseId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Lease Details</h2>
        <p className="text-sm text-gray-400">No lease on file.</p>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Lease Details</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
            <select name="unit_id" value={data.unit_id} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">— No unit —</option>
              {props.allUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {u.property_name} - Unit {u.unit_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lease Status</label>
            <select name="lease_status" value={data.lease_status} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {LEASE_STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Rent</label>
            <input type="number" name="monthly_rent" value={data.monthly_rent} onChange={handleChange}
              step="0.01" min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Security Deposit</label>
            <input type="number" name="security_deposit" value={data.security_deposit} onChange={handleChange}
              step="0.01" min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lease Start</label>
            <input type="date" name="start_date" value={data.start_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lease End</label>
            <input type="date" name="end_date" value={data.end_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Move-in Date</label>
            <input type="date" name="move_in_date" value={data.move_in_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Last Renewal</label>
            <input type="date" name="last_lease_renewal" value={data.last_lease_renewal} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Next Rent Increase</label>
            <input type="date" name="next_rent_increase_date" value={data.next_rent_increase_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
            <input type="text" name="tenant_tags" value={data.tenant_tags} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea name="notes" value={data.notes} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Lease Details</h2>
        <button onClick={() => setEditing(true)}
          className="text-xs text-[#b22625] hover:underline font-medium">
          Edit
        </button>
      </div>
      <dl className="space-y-3 text-sm">
        {props.unitId && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Unit</dt>
            <dd className="text-gray-900 font-medium">
              {props.allUnits.find(u => u.id === props.unitId)
                ? `${props.allUnits.find(u => u.id === props.unitId)!.property_name} - Unit ${props.allUnits.find(u => u.id === props.unitId)!.unit_number}`
                : '—'}
            </dd>
          </div>
        )}
        {props.lease_status && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Lease Status</dt>
            <dd className="text-gray-900 font-medium">{props.lease_status}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-gray-500">Monthly Rent</dt>
          <dd className="text-gray-900 font-medium">{fmtMoney(props.monthly_rent)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Security Deposit</dt>
          <dd className="text-gray-900 font-medium">{fmtMoney(props.security_deposit)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Lease Start</dt>
          <dd className="text-gray-900 font-medium">{fmt(props.start_date)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Lease End</dt>
          <dd className="text-gray-900 font-medium">{fmt(props.end_date)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Move-in Date</dt>
          <dd className="text-gray-900 font-medium">{fmt(props.move_in_date)}</dd>
        </div>
        {props.last_lease_renewal && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Last Renewal</dt>
            <dd className="text-gray-900 font-medium">{fmt(props.last_lease_renewal)}</dd>
          </div>
        )}
        {props.next_rent_increase_date && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Next Rent Increase</dt>
            <dd className="text-gray-900 font-medium">{fmt(props.next_rent_increase_date)}</dd>
          </div>
        )}
        {props.tenant_tags && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Tags</dt>
            <dd className="text-gray-900 font-medium">{props.tenant_tags}</dd>
          </div>
        )}
        {props.notes && (
          <div className="pt-2 border-t border-gray-100">
            <dt className="text-gray-500 mb-1">Notes</dt>
            <dd className="text-gray-700 text-sm whitespace-pre-wrap">{props.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
