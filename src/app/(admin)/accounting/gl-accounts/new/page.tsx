'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NewGLAccountPage() {
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    account_type: 'Expense',
    parent_account_number: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('gl_accounts')
        .insert([{
          account_number: formData.account_number,
          account_name: formData.account_name,
          account_type: formData.account_type,
          parent_account_number: formData.parent_account_number || null,
        }])
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error creating GL account:', err)
      alert('Error creating account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created</h2>
          <p className="text-gray-600 mb-6">{formData.account_number}: {formData.account_name}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/accounting/gl-accounts" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">
              View Accounts
            </Link>
            <button
              onClick={() => { setSubmitted(false); setFormData({ account_number: '', account_name: '', account_type: 'Expense', parent_account_number: '' }) }}
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">New GL Account</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
            <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., 4100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
            <select name="account_type" value={formData.account_type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="Cash">Cash</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Capital">Capital</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
              <option value="Other Expense">Other Expense</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
          <input type="text" name="account_name" value={formData.account_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., Rent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Account Number</label>
          <input type="text" name="parent_account_number" value={formData.parent_account_number} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Optional - e.g., 6400" />
        </div>
        <div className="pt-4 border-t border-gray-200">
          <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  )
}
