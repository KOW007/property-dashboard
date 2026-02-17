'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ServiceRequestPage() {
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    name: '',
    title: '',
    description: '',
    priority: 'medium',
  })

  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Load properties on mount
  useEffect(() => {
    async function loadProperties() {
      const { data } = await supabase
        .from('properties')
        .select('id, name')
        .order('name')
      setProperties(data || [])
    }
    loadProperties()
  }, [])

  // Load units when property changes
  useEffect(() => {
    async function loadUnits() {
      if (!formData.property_id) {
        setUnits([])
        return
      }
      const { data } = await supabase
        .from('units')
        .select('id, unit_number')
        .eq('property_id', formData.property_id)
        .order('unit_number')
      setUnits(data || [])
    }
    loadUnits()
    setFormData(prev => ({ ...prev, unit_id: '' }))
  }, [formData.property_id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Try to find the tenant by unit
      let tenantId = null
      if (formData.unit_id) {
        const { data: tenantData } = await supabase
          .from('current_tenants')
          .select('id')
          .eq('unit_id', formData.unit_id)
          .limit(1)
        if (tenantData && tenantData.length > 0) {
          tenantId = tenantData[0].id
        }
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .insert([{
          unit_id: formData.unit_id,
          tenant_id: tenantId,
          title: formData.title,
          description: `Submitted by: ${formData.name}\n\n${formData.description}`,
          priority: formData.priority,
          status: 'open',
          reported_date: new Date().toISOString(),
        }])

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting request:', err)
      alert('Error submitting request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-600 mb-6">Your maintenance request has been received. We will get back to you shortly.</p>
          <button
            onClick={() => { setSubmitted(false); setFormData({ property_id: '', unit_id: '', name: '', title: '', description: '', priority: 'Medium' }) }}
            className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Service Request</h1>
        <p className="text-gray-600 mb-8">Submit a maintenance request for your unit</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="First and last name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Property & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
              <select
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Property</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                name="unit_id"
                value={formData.unit_id}
                onChange={handleChange}
                required
                disabled={!formData.property_id}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
              >
                <option value="">Select Unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.unit_number}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What needs to be fixed? *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Leaky faucet in kitchen"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Please describe the issue in detail..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How urgent is this?</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="low">Low - Not urgent, can wait</option>
              <option value="medium">Medium - Needs attention soon</option>
              <option value="high">High - Needs attention quickly</option>
              <option value="emergency">Emergency - Water leak, no heat, etc.</option>
            </select>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#b22625] text-white px-8 py-3 rounded-lg hover:bg-[#8a1d1c] disabled:bg-gray-400 font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
