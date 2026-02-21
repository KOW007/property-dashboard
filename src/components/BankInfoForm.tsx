'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
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
}

export default function BankInfoForm({ tenantId, existing }: { tenantId: string, existing?: BankInfo | null }) {
  const [form, setForm] = useState({
    bank_name: existing?.bank_name || '',
    account_holder_name: existing?.account_holder_name || '',
    routing_number: existing?.routing_number || '',
    account_number: existing?.account_number || '',
    account_type: existing?.account_type || 'checking',
    payment_day: existing?.payment_day?.toString() || '1',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const payload = {
      tenant_id: tenantId,
      ...form,
      payment_day: parseInt(form.payment_day),
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
      await supabase.from('tenant_bank_info').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('tenant_bank_info').insert([payload])
    }

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saved && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">
          ✅ Bank information saved successfully.
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
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Your bank information is stored securely and used only to generate ACH debit files for your monthly payment.
      </p>

      <button type="submit" disabled={saving}
        className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black disabled:bg-gray-400 font-medium text-sm transition-colors">
        {saving ? 'Saving...' : existing ? 'Update Bank Info' : 'Save Bank Info'}
      </button>
    </form>
  )
}
