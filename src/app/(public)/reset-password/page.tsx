'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [invalid, setInvalid]     = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const type  = searchParams.get('type')

    if (!token || type !== 'recovery') {
      setInvalid(true)
      setVerifying(false)
      return
    }

    // Verify the token with Supabase — this establishes a session
    supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })
      .then(({ error }) => {
        if (error) setInvalid(true)
      })
      .finally(() => setVerifying(false))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      // Redirect to portal after 3 seconds
      setTimeout(() => router.push('/portal'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Spearhead Properties" width={200} height={40} priority />
        </div>

        {verifying ? (
          <p className="text-center text-gray-500 text-sm">Verifying your link...</p>
        ) : invalid ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Link expired or invalid</h2>
            <p className="text-gray-500 text-sm mb-6">
              This password reset link has expired or already been used.
              Please request a new one.
            </p>
            <button
              onClick={() => router.push('/portal-login')}
              className="bg-[#2d2d2d] text-white px-6 py-2.5 rounded-lg hover:bg-black font-medium text-sm transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated</h2>
            <p className="text-gray-500 text-sm">Redirecting you to the portal...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Choose a new password</h1>
            <p className="text-center text-gray-500 text-sm mb-8">Must be at least 8 characters.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black disabled:bg-gray-400 font-semibold transition-colors"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
