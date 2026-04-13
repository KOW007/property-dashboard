'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BankInfo {
  id?: string
  bank_name?: string
  account_holder_name?: string
  routing_number?: string
  account_number?: string
  account_type?: string
  payment_day?: number
  status?: string
  ach_authorized_at?: string
}

const AUTHORIZATION_TEXT =
  'I authorize Spearhead Properties to initiate ACH debit entries to my bank account ' +
  'for the monthly rent amount due, on or around the payment day I select each month. ' +
  'I understand this authorization will remain in effect until I revoke it in writing.'

export default function BankInfoForm({ tenantId, existing }: { tenantId: string, existing?: BankInfo | null }) {
  const [form, setForm] = useState({
    bank_name:            existing?.bank_name || '',
    account_holder_name:  existing?.account_holder_name || '',
    routing_number:       existing?.routing_number || '',
    account_number:       existing?.account_number || '',
    account_type:         existing?.account_type || 'checking',
    payment_day:          existing?.payment_day?.toString() || '1',
  })
  const [authorized, setAuthorized] = useState(!!existing?.ach_authorized_at)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!authorized) {
      setError('You must authorize ACH debits before saving.')
      return
    }

    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/portal-bank-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          payment_day:        parseInt(form.payment_day),
          authorized:         true,
          authorization_text: AUTHORIZATION_TEXT,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save bank info')
      }

      setSaved(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saved && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">
          Bank information saved successfully.
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
          <input type="text" name="bank_name" required value={form.bank_name} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
          <input type="text" name="account_holder_name" required value={form.account_holder_name} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number *</label>
          <input type="text" name="routing_number" required value={form.routing_number} onChange={handleChange}
            maxLength={9} placeholder="9-digit routing number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
          <input type="text" name="account_number" required value={form.account_number} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
            <select name="account_type" value={form.account_type} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]">
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Day (1–28) *</label>
            <input type="number" name="payment_day" required min={1} max={28} value={form.payment_day} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]" />
            <p className="text-xs text-gray-400 mt-1">Day of month your rent will be debited</p>
          </div>
        </div>
      </div>

      {/* NACHA ACH Authorization Agreement */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">ACH Debit Authorization</p>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">{AUTHORIZATION_TEXT}</p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={authorized}
            onChange={e => setAuthorized(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#b22625] focus:ring-[#b22625]"
          />
          <span className="text-xs text-gray-700">
            I agree to the above ACH debit authorization.
            {existing?.ach_authorized_at && (
              <span className="ml-1 text-gray-400">
                (Previously authorized {new Date(existing.ach_authorized_at).toLocaleDateString()})
              </span>
            )}
          </span>
        </label>
      </div>

      <button type="submit" disabled={saving || !authorized}
        className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black disabled:bg-gray-400 font-medium text-sm transition-colors">
        {saving ? 'Saving...' : existing ? 'Update Bank Info' : 'Save Bank Info'}
      </button>
    </form>
  )
}
