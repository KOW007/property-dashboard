'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NewBankTransferPage() {
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    transfer_date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bank_accounts')
        .select('id, account_name')
        .order('account_name')
      setBankAccounts(data || [])
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.from_account_id === formData.to_account_id) {
      alert('From and To accounts must be different.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('bank_transfers').insert([{
        from_account_id: formData.from_account_id,
        to_account_id: formData.to_account_id,
        amount: Number(formData.amount),
        transfer_date: formData.transfer_date,
        description: formData.description || null,
      }])
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error creating bank transfer:', err)
      alert('Error creating bank transfer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Created</h2>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/accounting/bank-transfers" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">View Transfers</Link>
            <button onClick={() => { setSubmitted(false); setFormData({ from_account_id: '', to_account_id: '', amount: '', transfer_date: new Date().toISOString().split('T')[0], description: '' }) }} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">New Bank Transfer</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Account *</label>
            <select name="from_account_id" value={formData.from_account_id} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select Account</option>
              {bankAccounts.map(a => (<option key={a.id} value={a.id}>{a.account_name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Account *</label>
            <select name="to_account_id" value={formData.to_account_id} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select Account</option>
              {bankAccounts.map(a => (<option key={a.id} value={a.id}>{a.account_name}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" min="0.01" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date *</label>
            <input type="date" name="transfer_date" value={formData.transfer_date} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Transfer description" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div className="pt-4 border-t border-gray-200">
          <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
            {submitting ? 'Creating...' : 'Create Transfer'}
          </button>
        </div>
      </form>
    </div>
  )
}
