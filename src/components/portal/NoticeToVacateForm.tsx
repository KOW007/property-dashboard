'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  tenantId: string
  tenantName: string
}

export default function NoticeToVacateForm({ tenantId, tenantName }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    move_out_date: '',
    move_out_reason: '',
    move_out_reason_other: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.move_out_date) {
      alert('Please select a desired move-out date.')
      return
    }
    const reason = data.move_out_reason === 'Other' ? data.move_out_reason_other : data.move_out_reason
    if (!reason) {
      alert('Please provide a reason for moving out.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          status: 'Notice-Unrented',
          notice_date: new Date().toISOString().split('T')[0],
          move_out_date: data.move_out_date,
          move_out_reason: reason,
        })
        .eq('id', tenantId)
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting notice:', err)
      alert('Error submitting your request. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Request to Move Out</h1>
        <div className="max-w-xl bg-white rounded-xl shadow-sm border-t-4 border-green-400 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Request Submitted</h2>
          <p className="text-sm text-gray-600 mb-4">
            Thank you, {tenantName}. Your notice to vacate has been submitted. Our team will be in touch to confirm details.
          </p>
          <Link
            href="/portal/contact"
            className="inline-block bg-[#2d2d2d] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            Back to Contact Us
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal/contact" className="text-sm text-[#b22625] hover:underline">
          ← Back to Contact Us
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Request to Move Out</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-orange-400 p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Please fill out the form below to submit your notice to vacate. Our team will follow up with you to confirm your move-out details.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desired Move-Out Date</label>
            <input
              type="date"
              name="move_out_date"
              value={data.move_out_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Moving Out</label>
            <select
              name="move_out_reason"
              value={data.move_out_reason}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="Relocating">Relocating</option>
              <option value="Purchasing a home">Purchasing a home</option>
              <option value="Rent too high">Rent too high</option>
              <option value="Job change">Job change</option>
              <option value="Personal reasons">Personal reasons</option>
              <option value="Dissatisfied with property">Dissatisfied with property</option>
              <option value="Lease not renewed">Lease not renewed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {data.move_out_reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Please specify</label>
              <textarea
                name="move_out_reason_other"
                value={data.move_out_reason_other}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                required
                placeholder="Please describe your reason for moving out..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#b22625] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#8a1d1c] disabled:bg-gray-400 transition-colors"
        >
          {saving ? 'Submitting...' : 'Submit Notice to Vacate'}
        </button>
      </form>
    </div>
  )
}
