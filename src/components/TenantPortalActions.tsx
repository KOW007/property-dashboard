'use client'

import { useState } from 'react'

interface Props {
  email: string
  tenantName: string
}

export default function TenantPortalActions({ email, tenantName }: Props) {
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleInvite = async () => {
    if (inviteStatus === 'sent') return
    setInviteStatus('sending')
    const res = await fetch('/api/invite-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, tenantName }),
    })
    if (res.ok) {
      setInviteStatus('sent')
    } else {
      const data = await res.json()
      alert(`Failed to send invite: ${data.error}`)
      setInviteStatus('error')
    }
  }

  const handleReset = async () => {
    if (resetStatus === 'sent') return
    setResetStatus('sending')
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setResetStatus('sent')
    } else {
      const data = await res.json()
      alert(`Failed to send password reset: ${data.error}`)
      setResetStatus('error')
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleInvite}
        disabled={inviteStatus === 'sending' || inviteStatus === 'sent'}
        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
          inviteStatus === 'sent'
            ? 'bg-green-100 text-green-700 cursor-default'
            : inviteStatus === 'sending'
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : 'bg-[#2d2d2d] text-white hover:bg-black'
        }`}
      >
        {inviteStatus === 'sent' ? '✓ Portal Link Sent' : inviteStatus === 'sending' ? 'Sending...' : '✉ Send Portal Link'}
      </button>
      <button
        onClick={handleReset}
        disabled={resetStatus === 'sending' || resetStatus === 'sent'}
        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
          resetStatus === 'sent'
            ? 'bg-green-100 text-green-700 cursor-default'
            : resetStatus === 'sending'
            ? 'bg-gray-100 text-gray-400 cursor-wait'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {resetStatus === 'sent' ? '✓ Reset Sent' : resetStatus === 'sending' ? 'Sending...' : '🔑 Password Reset'}
      </button>
    </div>
  )
}
