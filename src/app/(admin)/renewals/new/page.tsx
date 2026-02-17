'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function RenewalFormPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <RenewalForm />
    </Suspense>
  )
}

function RenewalForm() {
  const searchParams = useSearchParams()
  const leaseId = searchParams.get('lease_id')

  const [leaseData, setLeaseData] = useState<any>(null)
  const [newEndDate, setNewEndDate] = useState('')
  const [newRent, setNewRent] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLease() {
      if (!leaseId) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('lease_renewals')
        .select('*')
        .eq('lease_id', leaseId)
        .single()

      if (data) {
        setLeaseData(data)
        setNewRent(String(data.current_rent))
        // Default new end date to 1 year from current end date
        if (data.end_date) {
          const endDate = new Date(data.end_date)
          endDate.setFullYear(endDate.getFullYear() + 1)
          setNewEndDate(endDate.toISOString().split('T')[0])
        }
      }
      setLoading(false)
    }
    loadLease()
  }, [leaseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('leases')
        .update({
          end_date: newEndDate,
          monthly_rent: Number(newRent),
          last_lease_renewal: new Date().toISOString().split('T')[0],
          notes: notes || null,
        })
        .eq('id', leaseId)

      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error processing renewal:', err)
      alert('Error processing renewal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading lease data...</p>
      </div>
    )
  }

  if (!leaseId || !leaseData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Lease Selected</h2>
          <p className="text-gray-600 mb-6">Please select a lease from the renewals list.</p>
          <Link href="/renewals" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">
            View Renewals
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Renewal Processed</h2>
          <p className="text-gray-600 mb-6">
            The lease for {leaseData.tenant_name} has been renewed through {new Date(newEndDate).toLocaleDateString()}.
          </p>
          <Link href="/renewals" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">
            Back to Renewals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/renewals" className="text-[#b22625] hover:text-[#8a1d1c] text-sm mb-2 inline-block">
          ← Back to Renewals
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Prepare Renewal</h1>
        <p className="text-gray-600 mb-8">Renew lease for {leaseData.tenant_name}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {/* Current Lease Info (read-only) */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Lease</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Property</label>
                <p className="text-sm font-medium text-gray-900">{leaseData.property_name}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit</label>
                <p className="text-sm font-medium text-gray-900">{leaseData.unit_number}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tenant</label>
                <p className="text-sm font-medium text-gray-900">{leaseData.tenant_name}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Current End Date</label>
                <p className="text-sm font-medium text-gray-900">{new Date(leaseData.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Current Rent</label>
                <p className="text-sm font-medium text-green-600">${Number(leaseData.current_rent).toLocaleString()}/mo</p>
              </div>
              {leaseData.last_lease_renewal && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last Renewal</label>
                  <p className="text-sm font-medium text-gray-900">{new Date(leaseData.last_lease_renewal).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* New Lease Terms */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">New Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New End Date *</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Monthly Rent *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={newRent}
                    onChange={(e) => setNewRent(e.target.value)}
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2"
                  />
                </div>
                {Number(newRent) !== Number(leaseData.current_rent) && (
                  <p className={`text-xs mt-1 ${Number(newRent) > Number(leaseData.current_rent) ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(newRent) > Number(leaseData.current_rent) ? '+' : ''}
                    ${(Number(newRent) - Number(leaseData.current_rent)).toLocaleString()}/mo
                    ({((Number(newRent) - Number(leaseData.current_rent)) / Number(leaseData.current_rent) * 100).toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Renewal notes..."
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
              {submitting ? 'Processing...' : 'Process Renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
