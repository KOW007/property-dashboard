'use client'

import { useState } from 'react'
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
  const [editingUnit, setEditingUnit] = useState(false)
  const [unitValue, setUnitValue] = useState(desiredUnit || '')
  const [propertyValue, setPropertyValue] = useState(desiredProperty || '')
  const [savingUnit, setSavingUnit] = useState(false)
  const router = useRouter()

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
            <input
              type="text"
              value={propertyValue}
              onChange={e => setPropertyValue(e.target.value)}
              placeholder="Property name"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              value={unitValue}
              onChange={e => setUnitValue(e.target.value)}
              placeholder="Unit number"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
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
        {status !== 'approved' && (
          <button
            onClick={() => { setShowNotes(true); updateStatus('approved') }}
            disabled={saving}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm disabled:opacity-50"
          >
            ✓ Approve
          </button>
        )}
        {status !== 'denied' && (
          <button
            onClick={() => { setShowNotes(true); updateStatus('denied') }}
            disabled={saving}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm disabled:opacity-50"
          >
            ✗ Deny
          </button>
        )}
        {status !== 'waitlist' && (
          <button
            onClick={() => { setShowNotes(true); updateStatus('waitlist') }}
            disabled={saving}
            className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 text-sm disabled:opacity-50"
          >
            Waitlist
          </button>
        )}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          title="Add notes"
        >
          📝
        </button>
      </div>
      {status !== 'pending' && (
        <div className={`text-xs text-center font-medium py-1 rounded ${
          status === 'approved' ? 'text-green-600 bg-green-50' :
          status === 'denied' ? 'text-red-600 bg-red-50' :
          'text-yellow-600 bg-yellow-50'
        }`}>
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      )}
    </div>
  )
}
