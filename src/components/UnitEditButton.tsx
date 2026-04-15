'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UnitData {
  id: string
  unit_number: string | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  market_rent: number | null
}

export default function UnitEditButton({ unit }: { unit: UnitData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    unit_number: unit.unit_number ?? '',
    bedrooms:    unit.bedrooms    != null ? String(unit.bedrooms)    : '',
    bathrooms:   unit.bathrooms   != null ? String(unit.bathrooms)   : '',
    square_feet: unit.square_feet != null ? String(unit.square_feet) : '',
    market_rent: unit.market_rent != null ? String(unit.market_rent) : '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[#b22625] font-medium hover:underline cursor-pointer"
      >
        {unit.unit_number || '—'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              Edit Unit {unit.unit_number}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                <input
                  type="text"
                  value={form.unit_number}
                  onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.bedrooms}
                    onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.bathrooms}
                    onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square Feet</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.square_feet}
                  onChange={e => setForm(f => ({ ...f, square_feet: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market Rent ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.market_rent}
                  onChange={e => setForm(f => ({ ...f, market_rent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#2d2d2d] text-white rounded-lg text-sm font-medium hover:bg-black disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
