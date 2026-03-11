'use client'

import { useState } from 'react'

export default function InviteTenantButton({ email, tenantName, alreadyInvited }: { email?: string | null, tenantName?: string | null, alreadyInvited?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  if (!email || alreadyInvited) return null

  const handleInvite = async () => {
    if (status === 'sent') return
    setStatus('sending')

    const res = await fetch('/api/invite-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tenantName }),
    })

    if (res.ok) {
      setStatus('sent')
    } else {
      const data = await res.json()
      alert(`Failed to send invite: ${data.error}`)
      setStatus('error')
    }
  }

  return (
    <button
      onClick={handleInvite}
      disabled={status === 'sending' || status === 'sent'}
      title={`Invite ${tenantName || email} to tenant portal`}
      className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
        status === 'sent'
          ? 'bg-green-100 text-green-700 cursor-default'
          : status === 'sending'
          ? 'bg-gray-100 text-gray-400 cursor-wait'
          : 'bg-[#2d2d2d] text-white hover:bg-black cursor-pointer'
      }`}
    >
      {status === 'sent' ? '✓ Invited' : status === 'sending' ? 'Sending...' : '✉ Invite'}
    </button>
  )
}
