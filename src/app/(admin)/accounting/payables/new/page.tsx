'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function NewPayablePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <NewPayableForm />
    </Suspense>
  )
}

function NewPayableForm() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'bill'

  const [formData, setFormData] = useState({
    payee: '',
    ref_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    property_id: '',
    unit_id: '',
    gl_account_id: '',
    amount: '',
    status: 'unpaid',
    cash_account_id: '',
    description: '',
  })

  const [glAccounts, setGlAccounts] = useState<any[]>([])
  const [cashAccounts, setCashAccounts] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: gl }, { data: props }] = await Promise.all([
        supabase.from('gl_accounts').select('id, account_number, account_name, account_type').order('account_number'),
        supabase.from('properties').select('id, name').order('name'),
      ])
      setGlAccounts(gl || [])
      setCashAccounts((gl || []).filter(a => a.account_type === 'Cash'))
      setProperties(props || [])
    }
    load()
  }, [])

  useEffect(() => {
    async function loadUnits() {
      if (!formData.property_id) { setUnits([]); return }
      const { data } = await supabase.from('units').select('id, unit_number').eq('property_id', formData.property_id).order('unit_number')
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
      const { error } = await supabase.from('payables').insert([{
        type,
        payee: formData.payee,
        ref_number: formData.ref_number || null,
        bill_date: formData.bill_date,
        due_date: formData.due_date || null,
        property_id: formData.property_id || null,
        unit_id: formData.unit_id || null,
        gl_account_id: formData.gl_account_id || null,
        amount: Number(formData.amount),
        status: formData.status,
        cash_account_id: formData.cash_account_id || null,
        description: formData.description || null,
      }])
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error('Error creating payable:', err)
      alert('Error creating entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{type === 'bill' ? 'Bill' : 'Payment'} Created</h2>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/accounting/payables" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">View Payables</Link>
            <button onClick={() => { setSubmitted(false); setFormData({ ...formData, payee: '', amount: '', ref_number: '', description: '' }) }} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{type === 'bill' ? 'Enter Bill' : 'Record Payment'}</h2>
      <p className="text-gray-600 mb-6">{type === 'bill' ? 'Enter a new bill to track' : 'Record a payment made'}</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payee *</label>
            <input type="text" name="payee" value={formData.payee} onChange={handleChange} required placeholder="Vendor or payee name" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ref #</label>
            <input type="text" name="ref_number" value={formData.ref_number} onChange={handleChange} placeholder="Reference number" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date *</label>
            <input type="date" name="bill_date" value={formData.bill_date} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select name="property_id" value={formData.property_id} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select Property</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select name="unit_id" value={formData.unit_id} onChange={handleChange} disabled={!formData.property_id} className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100">
              <option value="">Select Unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.unit_number}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GL Account</label>
          <select name="gl_account_id" value={formData.gl_account_id} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="">Select GL Account</option>
            {glAccounts.map(g => (
              <option key={g.id} value={g.id}>{g.account_number}: {g.account_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="on_hold">On Hold</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cash Account</label>
          <select name="cash_account_id" value={formData.cash_account_id} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="">Select Cash Account</option>
            {cashAccounts.map(c => (
              <option key={c.id} value={c.id}>{c.account_number}: {c.account_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Optional description..." className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button type="submit" disabled={submitting} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
            {submitting ? 'Creating...' : `Create ${type === 'bill' ? 'Bill' : 'Payment'}`}
          </button>
        </div>
      </form>
    </div>
  )
}
