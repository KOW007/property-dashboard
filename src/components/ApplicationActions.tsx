'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ApplicationActions({ appId, currentStatus, email, backgroundCheckStatus, desiredProperty, desiredUnit }: {
  appId: string
  currentStatus: string
  email?: string
  backgroundCheckStatus?: string
  desiredProperty?: string
  desiredUnit?: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [editingUnit, setEditingUnit] = useState(false)
  const [unitValue, setUnitValue] = useState(desiredUnit || '')
  const [propertyValue, setPropertyValue] = useState(desiredProperty || '')
  const [savingUnit, setSavingUnit] = useState(false)
  const [vacancies, setVacancies] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    if (editingUnit && vacancies.length === 0) {
      fetch('/api/all-units')
        .then(r => r.json())
        .then(data => setVacancies(data || []))
    }
  }, [editingUnit])

  const properties = [...new Set(vacancies.map((v: any) => v.property_name))]
  const availableUnits = vacancies.filter((v: any) => v.property_name === propertyValue)

  const screeningUrl = `https://apply.rentspree.com/?email=${encodeURIComponent(email || '')}`

  const updateStatus = async (newStatus: string) => {
    setSaving(true)
    const { error } = await supabase
      .from('tenant_applications')
      .update({
        status: newStatus,
        review_notes: notes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', appId)

    if (!error) {
      setStatus(newStatus)
      setShowNotes(false)
      router.refresh()
    } else {
      alert('Error updating status. Please try again.')
    }
    setSaving(false)
  }

  const convertToTenant = async () => {
    if (!email) {
      alert('Application has no email address.')
      return
    }
    setConverting(true)
    try {
      // Fetch full application data
      const { data: app, error: appError } = await supabase
        .from('tenant_applications')
        .select('*')
        .eq('id', appId)
        .single()

      if (appError || !app) throw new Error('Could not fetch application data.')

      // Resolve unit_id from property name + unit number
      let unitId: string | null = null
      if (app.desired_property && app.desired_unit && app.desired_unit !== 'Not sure yet') {
        const unitsRes = await fetch('/api/all-units')
        const allUnits = await unitsRes.json()
        const match = allUnits.find((u: any) =>
          u.property_name === app.desired_property && u.unit_number === app.desired_unit
        )
        if (match) unitId = match.id
      }

      const tenantData = {
        first_name: app.first_name || null,
        last_name: app.last_name || null,
        email: app.email,
        phone: app.phone || null,
        birthdate: app.date_of_birth || null,
        ssn: app.ssn || null,
        drivers_license: app.gov_id_number || null,
        drivers_license_state: app.gov_id_issuing_state || null,
        emergency_contact_name: app.emergency_contact_name || null,
        emergency_contact_phone: app.emergency_contact_phone || null,
        emergency_contact_relationship: app.emergency_contact_relationship || null,
        pets: app.pet_details || null,
        license_plates: app.vehicle_1_license_plate || null,
        status: 'Future',
        is_primary_tenant: true,
      }

      // Check if tenant already exists
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('email', app.email)
        .single()

      let tenantId: string
      if (existing) {
        // Update existing tenant
        const { error: updateError } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', existing.id)
        if (updateError) throw updateError
        tenantId = existing.id
      } else {
        // Insert new tenant
        const { data: newTenant, error: insertError } = await supabase
          .from('tenants')
          .insert(tenantData)
          .select('id')
          .single()
        if (insertError) throw insertError
        tenantId = newTenant.id
      }

      // Link tenant to unit via unit_tenants junction table
      if (unitId) {
        // Check if link already exists
        const { data: existingLink } = await supabase
          .from('unit_tenants')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('unit_id', unitId)
          .single()

        if (!existingLink) {
          const { error: linkError } = await supabase
            .from('unit_tenants')
            .insert({ tenant_id: tenantId, unit_id: unitId })
          if (linkError) throw linkError
        }
      }

      // Mark application as converted
      const { error: convertError } = await supabase
        .from('tenant_applications')
        .update({ status: 'converted' })
        .eq('id', appId)
      if (convertError) throw convertError

      setStatus('converted')
      router.refresh()
    } catch (err: any) {
      console.error('Error converting to tenant:', err)
      alert('Error converting to tenant: ' + (err.message || 'Please try again.'))
    } finally {
      setConverting(false)
    }
  }

  const saveUnit = async () => {
    setSavingUnit(true)
    const { error } = await supabase
      .from('tenant_applications')
      .update({ desired_property: propertyValue || null, desired_unit: unitValue || null })
      .eq('id', appId)
    if (!error) {
      setEditingUnit(false)
      router.refresh()
    } else {
      alert('Error saving unit assignment.')
    }
    setSavingUnit(false)
  }

  return (
    <div className="mt-4 space-y-3">

      {/* Unit Assignment */}
      <div className="bg-gray-50 rounded p-3 text-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Assignment</span>
          {editingUnit && (
            <button onClick={() => setEditingUnit(false)} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          )}
        </div>
        {editingUnit ? (
          <div className="space-y-2 mt-2">
            <select
              value={propertyValue}
              onChange={e => { setPropertyValue(e.target.value); setUnitValue('') }}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="">Select a property...</option>
              {properties.map((p: string) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={unitValue}
              onChange={e => setUnitValue(e.target.value)}
              disabled={!propertyValue}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            >
              <option value="">Select a unit...</option>
              <option value="Not sure yet">Not sure yet</option>
              {availableUnits.map((u: any) => (
                <option key={u.unit_number} value={u.unit_number}>
                  Unit {u.unit_number}
                </option>
              ))}
            </select>
            <button
              onClick={saveUnit}
              disabled={savingUnit}
              className="w-full bg-[#2d2d2d] text-white py-1.5 rounded text-xs font-medium hover:bg-black disabled:opacity-50"
            >
              {savingUnit ? 'Saving...' : 'Save Unit'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingUnit(true)}
            className="text-left w-full text-gray-700 hover:text-[#b22625] transition-colors"
            title="Click to edit"
          >
            {propertyValue ? (
              <span>{propertyValue} — Unit {unitValue || 'N/A'}</span>
            ) : (
              <span className="text-gray-400 italic hover:text-[#b22625]">N/A — click to assign</span>
            )}
          </button>
        )}
      </div>

      {/* Screening */}
      <div className="flex items-center justify-between">
        <a
          href={screeningUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-[#2d2d2d] text-white px-3 py-2 rounded hover:bg-black text-sm font-medium"
        >
          🔍 Send Screening Link
        </a>
        {backgroundCheckStatus && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            backgroundCheckStatus === 'clear' ? 'bg-green-100 text-green-700' :
            backgroundCheckStatus === 'flagged' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            Background: {backgroundCheckStatus}
          </span>
        )}
      </div>
      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add review notes (optional)..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      )}
      <div className="flex gap-2">
        {status !== 'approved' && status !== 'converted' && (
          <button
            onClick={() => { setShowNotes(true); updateStatus('approved') }}
            disabled={saving}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm disabled:opacity-50"
          >
            ✓ Approve
          </button>
        )}
        {status !== 'denied' && status !== 'converted' && (
          <button
            onClick={() => { setShowNotes(true); updateStatus('denied') }}
            disabled={saving}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm disabled:opacity-50"
          >
            ✗ Deny
          </button>
        )}
        {status !== 'waitlist' && status !== 'converted' && (
          <button
            onClick={() => { setShowNotes(true); updateStatus('waitlist') }}
            disabled={saving}
            className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 text-sm disabled:opacity-50"
          >
            Waitlist
          </button>
        )}
        {status !== 'converted' && (
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            title="Add notes"
          >
            📝
          </button>
        )}
      </div>

      {/* Convert to Tenant button - only for approved applications */}
      {status === 'approved' && (
        <button
          onClick={convertToTenant}
          disabled={converting}
          className="w-full bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
        >
          {converting ? 'Converting...' : '→ Convert to Tenant'}
        </button>
      )}

      {status !== 'pending' && (
        <div className={`text-xs text-center font-medium py-1 rounded ${
          status === 'approved' ? 'text-green-600 bg-green-50' :
          status === 'denied' ? 'text-red-600 bg-red-50' :
          status === 'converted' ? 'text-purple-600 bg-purple-50' :
          'text-yellow-600 bg-yellow-50'
        }`}>
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )}
    </div>
  )
}
