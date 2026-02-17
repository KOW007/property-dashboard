'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ApplicationActions({ appId, currentStatus }: { appId: string, currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

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

  return (
    <div className="mt-4 space-y-3">
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
