'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NewWorkOrderPage() {
  const [formData, setFormData] = useState({
    property_id: '',
    unit_id: '',
    tenant_id: '',
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    estimated_cost: '',
    notes: '',
  })

  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
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
    setFormData(prev => ({ ...prev, unit_id: '', tenant_id: '' }))
    setTenants([])
  }, [formData.property_id])

  // Load tenants when unit changes
  useEffect(() => {
    async function loadTenants() {
      if (!formData.unit_id) {
        setTenants([])
        return
      }
      const { data } = await supabase
        .from('unit_tenants')
        .select('id, first_name, last_name')
        .eq('unit_id', formData.unit_id)
      setTenants(data || [])
      if (data && data.length === 1) {
        setFormData(prev => ({ ...prev, tenant_id: data[0].id }))
      }
    }
    loadTenants()
    setFormData(prev => ({ ...prev, tenant_id: '' }))
  }, [formData.unit_id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .insert([{
          unit_id: formData.unit_id,
          tenant_id: formData.tenant_id || null,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          status: 'open',
          assigned_to: formData.assigned_to || null,
          estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : null,
          notes: formData.notes || null,
          reported_date: new Date().toISOString(),
        }])

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error creating work order:', err)
      alert('Error creating work order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Order Created</h2>
          <p className="text-gray-600 mb-6">The work order has been submitted successfully.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/work-orders" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">
              View Work Orders
            </Link>
            <button
              onClick={() => { setSubmitted(false); setFormData({ property_id: '', unit_id: '', tenant_id: '', title: '', description: '', priority: 'Medium', assigned_to: '', estimated_cost: '', notes: '' }) }}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/work-orders" className="text-[#b22625] hover:text-[#8a1d1c] text-sm mb-2 inline-block">
          ← Back to Work Orders
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">New Work Order</h1>
        <p className="text-gray-600 mb-8">Create a new maintenance request</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
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

          {/* Tenant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <select
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              disabled={!formData.unit_id}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
            >
              <option value="">Select Tenant (optional)</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief description of the issue"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Detailed description of the maintenance issue..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Priority & Assigned To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <input
                type="text"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                placeholder="Vendor or staff name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="estimated_cost"
                value={formData.estimated_cost}
                onChange={handleChange}
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Internal notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {submitting ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
