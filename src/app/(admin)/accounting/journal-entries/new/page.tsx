'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface LineItem {
  gl_account_id: string
  debit: string
  credit: string
  description: string
}

export default function NewJournalEntryPage() {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<LineItem[]>([
    { gl_account_id: '', debit: '', credit: '', description: '' },
    { gl_account_id: '', debit: '', credit: '', description: '' },
  ])

  const [glAccounts, setGlAccounts] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: gl }, { data: props }] = await Promise.all([
        supabase.from('gl_accounts').select('id, account_number, account_name').order('account_number'),
        supabase.from('properties').select('id, name').order('name'),
      ])
      setGlAccounts(gl || [])
      setProperties(props || [])
    }
    load()
  }, [])

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0)
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit

  const updateLine = (index: number, field: keyof LineItem, value: string) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  const addLine = () => {
    setLines(prev => [...prev, { gl_account_id: '', debit: '', credit: '', description: '' }])
  }

  const removeLine = (index: number) => {
    if (lines.length <= 2) return
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBalanced) {
      alert('Debits and credits must balance before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_date: entryDate,
          reference_number: referenceNumber || null,
          description: description || null,
          property_id: propertyId || null,
        }])
        .select('id')
        .single()

      if (entryError) throw entryError

      const lineInserts = lines
        .filter(l => l.gl_account_id && (Number(l.debit) > 0 || Number(l.credit) > 0))
        .map(l => ({
          journal_entry_id: entry.id,
          gl_account_id: l.gl_account_id,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          description: l.description || null,
        }))

      if (lineInserts.length > 0) {
        const { error: linesError } = await supabase
          .from('journal_entry_lines')
          .insert(lineInserts)
        if (linesError) throw linesError
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Error creating journal entry:', err)
      alert('Error creating journal entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Journal Entry Created</h2>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/accounting/journal-entries" className="bg-[#b22625] text-white px-6 py-2 rounded-lg hover:bg-[#8a1d1c]">View Entries</Link>
            <button onClick={() => { setSubmitted(false); setLines([{ gl_account_id: '', debit: '', credit: '', description: '' }, { gl_account_id: '', debit: '', credit: '', description: '' }]); setReferenceNumber(''); setDescription('') }} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">New Journal Entry</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
              <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="">Select Property</option>
                {properties.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GL Account</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Credit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lines.map((line, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">
                    <select value={line.gl_account_id} onChange={e => updateLine(i, 'gl_account_id', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                      <option value="">Select Account</option>
                      {glAccounts.map(g => (<option key={g.id} value={g.id}>{g.account_number}: {g.account_name}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} step="0.01" placeholder="0.00" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} step="0.01" placeholder="0.00" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="text" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Line description" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                  </td>
                  <td className="px-4 py-2">
                    {lines.length > 2 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700 text-sm">X</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3">
                  <button type="button" onClick={addLine} className="text-[#b22625] hover:text-[#8a1d1c] text-sm font-medium">+ Add Line</button>
                </td>
                <td className="px-4 py-3 text-right font-bold text-sm">${totalDebit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold text-sm">${totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  {isBalanced ? (
                    <span className="text-green-600 font-medium">Balanced</span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                    </span>
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={submitting || !isBalanced} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium">
            {submitting ? 'Creating...' : 'Post Journal Entry'}
          </button>
          {!isBalanced && totalDebit > 0 && (
            <p className="text-red-500 text-sm self-center">Debits and credits must balance to submit</p>
          )}
        </div>
      </form>
    </div>
  )
}
