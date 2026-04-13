'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AccountProfileForm({ tenant }: { tenant: any }) {
  const [form, setForm] = useState({
    phone: tenant.phone || '',
    vehicle_make: tenant.vehicle_make || '',
    vehicle_model: tenant.vehicle_model || '',
    vehicle_year: tenant.vehicle_year || '',
    vehicle_color: tenant.vehicle_color || '',
    vehicle_license_plate: tenant.vehicle_license_plate || '',
    vehicle_state: tenant.vehicle_state || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('tenants').update(form).eq('id', tenant.id)
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">
          ✅ Profile updated successfully.
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <input type="text" name="vehicle_make" value={form.vehicle_make} onChange={handleChange}
              placeholder="e.g. Toyota"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input type="text" name="vehicle_model" value={form.vehicle_model} onChange={handleChange}
              placeholder="e.g. Camry"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input type="text" name="vehicle_year" value={form.vehicle_year} onChange={handleChange}
              placeholder="e.g. 2020"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input type="text" name="vehicle_color" value={form.vehicle_color} onChange={handleChange}
              placeholder="e.g. Silver"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
            <input type="text" name="vehicle_license_plate" value={form.vehicle_license_plate} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" name="vehicle_state" value={form.vehicle_state} onChange={handleChange}
              placeholder="e.g. TX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="bg-[#2d2d2d] text-white px-8 py-2.5 rounded-lg hover:bg-black disabled:bg-gray-400 font-medium text-sm transition-colors">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
