'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Activity {
  id: string
  date: string
  all_day: boolean
  time: string | null
  description: string | null
  label: string | null
  assign_to: string | null
  status: string | null
}

interface Props {
  tenantId: string
  tenantName: string
  activity?: Activity
  onClose: () => void
}

function parseTime(time24: string | null) {
  if (!time24) return { hours: '', minutes: '', ampm: 'AM' as const }
  const [h, m] = time24.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' as const : 'AM' as const
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return { hours: String(h12), minutes: m, ampm }
}

export default function TenantActivityForm({ tenantId, tenantName, activity, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!activity
  const parsed = activity ? parseTime(activity.time) : { hours: '', minutes: '', ampm: 'AM' as const }

  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: activity?.date || '',
    all_day: activity?.all_day || false,
    hours: parsed.hours,
    minutes: parsed.minutes,
    ampm: parsed.ampm,
    description: activity?.description || '',
    label: activity?.label || '',
    assign_to: activity?.assign_to || '',
    status: activity?.status || 'Pending',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    let timeValue: string | null = null
    if (!formData.all_day && formData.hours && formData.minutes) {
      let h = parseInt(formData.hours)
      if (formData.ampm === 'PM' && h !== 12) h += 12
      if (formData.ampm === 'AM' && h === 12) h = 0
      timeValue = `${String(h).padStart(2, '0')}:${formData.minutes}:00`
    }

    const payload = {
      tenant_id: tenantId,
      date: formData.date,
      all_day: formData.all_day,
      time: timeValue,
      description: formData.description || null,
      label: formData.label || null,
      assign_to: formData.assign_to || null,
      status: formData.status,
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('tenant_activities')
          .update(payload)
          .eq('id', activity.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tenant_activities')
          .insert([payload])
        if (error) throw error
      }
      window.location.reload()
    } catch (err) {
      console.error('Error saving activity:', err)
      alert('Error saving activity. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{isEdit ? 'Edit Activity' : 'New Activity'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tenant (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tenant</label>
            <p className="text-sm text-gray-900 font-medium py-2">{tenantName}</p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* All Day + Time */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                name="all_day"
                checked={formData.all_day}
                onChange={handleChange}
                className="h-4 w-4 text-[#b22625] rounded border-gray-300"
              />
              <label className="text-xs font-medium text-gray-500">All Day</label>
            </div>
            {!formData.all_day && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  placeholder="HH"
                  maxLength={2}
                  className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center"
                />
                <span className="text-gray-500">:</span>
                <input
                  type="text"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleChange}
                  placeholder="MM"
                  maxLength={2}
                  className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center"
                />
                <select
                  name="ampm"
                  value={formData.ampm}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description <span className="text-gray-400">({formData.description.length}/500)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              rows={2}
              placeholder="e.g. Tenant Move Out & Walk-Through"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Label <span className="text-gray-400">({formData.label.length}/15)</span>
            </label>
            <input
              type="text"
              name="label"
              value={formData.label}
              onChange={handleChange}
              maxLength={15}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assign To</label>
            <input
              type="text"
              name="assign_to"
              value={formData.assign_to}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#b22625] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#8a1d1c] disabled:bg-gray-400"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Activity' : 'Save Activity'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
