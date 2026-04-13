'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
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
      setError(error.message)
      setLoading(false)
    } else {
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 500)
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
    <div className="min-h-screen bg-[#2d2d2d] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">
          &larr; Back to Spearhead Properties
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Spearhead Properties"
            width={220}
            height={40}
            className="mx-auto mb-4"
          />
          {!forgotMode && (
            <p className="text-gray-600">Sign in to access the admin dashboard</p>
          )}
        </div>

        {!forgotMode ? (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
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
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#b22625] text-white py-3 rounded-lg hover:bg-[#8a1d1c] disabled:bg-gray-400 font-semibold transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Reset Password</h2>
            <p className="text-center text-gray-500 text-sm mb-6">
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
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {resetError}
                  </div>
                )}
                <form onSubmit={handleForgot} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-[#b22625] text-white py-3 rounded-lg hover:bg-[#8a1d1c] disabled:bg-gray-400 font-semibold transition-colors"
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

        {!forgotMode && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Authorized users only</p>
          </div>
        )}
      </div>
    </div>
  )
}
