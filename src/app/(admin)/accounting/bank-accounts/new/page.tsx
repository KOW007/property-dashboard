'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NewBankAccountPage() {
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    account_number: '',
    routing_number: '',
    property_id: '',
    gl_account_id: '',
    payments_enabled: false,
    balance: '',
  })

  const [properties, setProperties] = useState<any[]>([])
  const [cashAccounts, setCashAccounts] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: props }, { data: gl }] = await Promise.all([
        supabase.from('properties').select('id, name').order('name'),
        supabase.from('gl_accounts').select('id, account_number, account_name').eq('account_type', 'Cash').order('account_number'),
      ])
      setProperties(props || [])
      setCashAccounts(gl || [])
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.from('bank_accounts').insert([{
        account_name: formData.account_name,
        bank_name: formData.bank_name,
        account_number: formData.account_number || null,
        routing_number: formData.routing_number || null,
        property_id: formData.property_id || null,
        gl_account_id: formData.gl_account_id || null,
        payments_enabled: formData.payments_enabled,
        balance: formData.balance ? Number(formData.balance) : 0,
      }])
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error creating bank account:', err)
      alert('Error creating bank account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Account Created</h2>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/accounting/bank-accounts" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">View Accounts</Link>
            <button onClick={() => { setSubmitted(false); setFormData({ account_name: '', bank_name: '', account_number: '', routing_number: '', property_id: '', gl_account_id: '', payments_enabled: false, balance: '' }) }} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">New Bank Account</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
            <input type="text" name="account_name" value={formData.account_name} onChange={handleChange} required placeholder="e.g., 39th - BOC Operating" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
            <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} required placeholder="e.g., BOC Bank" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
            <input type="text" name="routing_number" value={formData.routing_number} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select name="property_id" value={formData.property_id} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select Property</option>
              {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GL Account (Cash)</label>
            <select name="gl_account_id" value={formData.gl_account_id} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select GL Account</option>
              {cashAccounts.map(g => (<option key={g.id} value={g.id}>{g.account_number}: {g.account_name}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input type="number" name="balance" value={formData.balance} onChange={handleChange} step="0.01" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2" />
            </div>
          </div>
          <div className="flex items-center pt-6">
            <input type="checkbox" name="payments_enabled" checked={formData.payments_enabled} onChange={handleChange} className="h-4 w-4 text-[#b22625] rounded border-gray-300" />
            <label className="ml-2 text-sm font-medium text-gray-700">Payments Enabled</label>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
            {submitting ? 'Creating...' : 'Create Bank Account'}
          </button>
        </div>
      </form>
    </div>
  )
}
