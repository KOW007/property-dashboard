'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChangePasswordForm() {
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState({ password: '', confirm: '' })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) throw error
      setSaved(true)
      setOpen(false)
      setForm({ password: '', confirm: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
        Password updated successfully.
      </div>
    )
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-[#b22625] hover:underline font-medium"
        >
          Change password
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#2d2d2d] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'Saving...' : 'Update password'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setForm({ password: '', confirm: '' }); setError(null) }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
