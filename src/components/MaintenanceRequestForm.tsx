'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MaintenanceRequestForm({ unitId, tenantId }: { unitId: string, tenantId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    await supabase.from('maintenance_requests').insert([{
      unit_id: unitId,
      tenant_id: tenantId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: 'open',
      reported_date: new Date().toISOString(),
    }])

    setSubmitting(false)
    setShowForm(false)
    setForm({ title: '', description: '', priority: 'medium' })
    router.refresh()
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black font-medium text-sm transition-colors"
      >
        Request Maintenance
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-800 text-sm">New Maintenance Request</h3>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
        <input type="text" required value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Leaking faucet in bathroom"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
        <textarea required value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          rows={3} placeholder="Please describe the issue in detail..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
        <select value={form.priority}
          onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="flex-1 bg-[#2d2d2d] text-white py-2 rounded-lg hover:bg-black disabled:bg-gray-400 font-medium text-sm">
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
        <button type="button" onClick={() => setShowForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </form>
  )
}
