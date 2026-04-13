'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PortalLoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  // Forgot password state
  const [forgotMode, setForgotMode]     = useState(false)
  const [resetEmail, setResetEmail]     = useState('')
  const [resetSent, setResetSent]       = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError]     = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/portal')
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email')
      setResetSent(true)
    } catch (err: any) {
      setResetError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Spearhead Properties" width={200} height={40} priority />
        </div>

        {!forgotMode ? (
          <>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Tenant Portal</h1>
            <p className="text-center text-gray-500 text-sm mb-8">Sign in to manage your account</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setResetEmail(email) }}
                    className="text-xs text-[#b22625] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black disabled:bg-gray-400 font-semibold transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Reset Password</h1>
            <p className="text-center text-gray-500 text-sm mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            {resetSent ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-sm text-center">
                <p className="font-semibold mb-1">Check your inbox or junk mail</p>
                <p>A password reset link has been sent to <strong>{resetEmail}</strong>.</p>
              </div>
            ) : (
              <>
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                    {resetError}
                  </div>
                )}
                <form onSubmit={handleForgot} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b22625]"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black disabled:bg-gray-400 font-semibold transition-colors"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}

            <button
              onClick={() => { setForgotMode(false); setResetSent(false); setResetError('') }}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; Back to sign in
            </button>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Need help? Contact us at{' '}
          <a href="tel:5122361512" className="text-[#b22625] hover:underline">(512) 236-1512</a>
        </p>
      </div>
    </div>
  )
}
