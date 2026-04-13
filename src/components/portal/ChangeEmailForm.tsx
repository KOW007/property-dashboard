'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen]         = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (newEmail === currentEmail) {
      setError('That is already your current email address.')
      return
    }

    setSending(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error

      // Notify the old address — fire and forget, don't block on it
      fetch('/api/portal-notify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      }).catch(() => {})

      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send confirmation. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
        Confirmation email sent to <strong>{newEmail}</strong>. Check your inbox or junk mail and click the link to confirm your new address.
      </div>
    )
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-[#b22625] hover:underline font-medium"
        >
          Change email address
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New email address</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
            />
          </div>
          <p className="text-xs text-gray-400">
            A confirmation link will be sent to your new address. Your email won't change until you click it.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="bg-[#2d2d2d] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black disabled:bg-gray-400 transition-colors"
            >
              {sending ? 'Sending...' : 'Send confirmation'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setNewEmail(''); setError(null) }}
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
