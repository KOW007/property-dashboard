'use client'

/**
 * ACH Export — client component
 *
 * Flow:
 *  1. Admin fills in ODFI (your bank) settings.
 *  2. Admin reviews receipts, enters each tenant's routing + account number.
 *  3. Admin authenticates with Azure AD (PKCE, no client secret).
 *  4. Admin clicks "Generate ACH File" → POST /api/ach-export → .ach download.
 *
 * Azure env vars needed (in .env.local):
 *   NEXT_PUBLIC_AZURE_TENANT_ID
 *   NEXT_PUBLIC_AZURE_CLIENT_ID
 *   NEXT_PUBLIC_AZURE_REDIRECT_URI  (e.g. http://localhost:3000/accounting/ach-export)
 */

import { useEffect, useState, useCallback } from 'react'
import { ShieldCheck, Download, AlertCircle, CheckCircle2, LogIn } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Receipt {
  id: string
  date: string | null
  payer: string | null
  amount: number | null
  reference: string | null
  property_name: string | null
  unit_number: string | null
}

interface EntryRow extends Receipt {
  included: boolean
  rdfiRouting: string
  rdfiAccount: string
  txCode: '27' | '22' | '37' | '32'
}

interface OdfiConfig {
  routingNumber: string
  companyName: string
  companyId: string
  entryDescription: string
  effectiveDate: string
  fileIdModifier: string
  bankName: string
}

// ─── Azure PKCE helpers ───────────────────────────────────────────────────────

function randomBase64Url(byteLength: number) {
  const arr = new Uint8Array(byteLength)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function sha256Base64Url(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function startAzureLogin() {
  const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ??
    `${window.location.origin}/accounting/ach-export`

  if (!tenantId || !clientId) {
    alert('Azure AD not configured. Set NEXT_PUBLIC_AZURE_TENANT_ID and NEXT_PUBLIC_AZURE_CLIENT_ID in .env.local')
    return
  }

  const verifier = randomBase64Url(32)
  const challenge = await sha256Base64Url(verifier)
  const state = randomBase64Url(16)

  sessionStorage.setItem('azure_pkce_verifier', verifier)
  sessionStorage.setItem('azure_pkce_state', state)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    prompt: 'select_account',
  })

  window.location.href =
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID!
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!
  const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ??
    `${window.location.origin}/accounting/ach-export`

  const verifier = sessionStorage.getItem('azure_pkce_verifier') ?? ''

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description ?? 'Token exchange failed')
  return data.id_token ?? data.access_token
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AchExportClient({ receipts }: { receipts: Receipt[] }) {
  // Azure state
  const [azureToken, setAzureToken] = useState<string | null>(null)
  const [azureUser, setAzureUser] = useState<string | null>(null)
  const [azureLoading, setAzureLoading] = useState(false)

  // ODFI config
  const [odfi, setOdfi] = useState<OdfiConfig>({
    routingNumber: '',
    companyName: 'Spearhead Properties',
    companyId: '',
    entryDescription: 'RENT',
    effectiveDate: nextBusinessDay(),
    fileIdModifier: 'A',
    bankName: '',
  })

  // Entry table state
  const [rows, setRows] = useState<EntryRow[]>(() =>
    receipts.map(r => ({
      ...r,
      included: true,
      rdfiRouting: '',
      rdfiAccount: '',
      txCode: '27',
    }))
  )

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ── Handle OAuth callback (code in URL params) ──────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const savedState = sessionStorage.getItem('azure_pkce_state')

    if (!code) {
      // Check if we have a stored token from a previous login
      const stored = sessionStorage.getItem('azure_token')
      const storedUser = sessionStorage.getItem('azure_user')
      if (stored) {
        setAzureToken(stored)
        setAzureUser(storedUser)
      }
      return
    }

    if (state !== savedState) {
      setError('Azure OAuth state mismatch — possible CSRF. Please try again.')
      return
    }

    // Clear code from URL without reloading
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.delete('session_state')
    window.history.replaceState({}, '', url.toString())

    setAzureLoading(true)
    exchangeCodeForToken(code)
      .then(token => {
        sessionStorage.setItem('azure_token', token)
        // Decode name from JWT payload (no library needed for display)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const name = payload.name ?? payload.upn ?? payload.email ?? 'Azure User'
          sessionStorage.setItem('azure_user', name)
          setAzureUser(name)
        } catch { /* ignore decode errors */ }
        setAzureToken(token)
        sessionStorage.removeItem('azure_pkce_verifier')
        sessionStorage.removeItem('azure_pkce_state')
      })
      .catch(err => setError(err.message))
      .finally(() => setAzureLoading(false))
  }, [])

  // ── Row helpers ─────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, patch: Partial<EntryRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }, [])

  const selectedRows = rows.filter(r => r.included)
  const totalCents = selectedRows.reduce((s, r) => s + Math.round((r.amount ?? 0) * 100), 0)

  // ── Generate ACH file ───────────────────────────────────────────────────
  async function generateAch() {
    setError(null)
    setSuccess(null)

    if (!azureToken) {
      setError('Authenticate with Azure AD before generating the file.')
      return
    }
    if (!selectedRows.length) {
      setError('Select at least one entry.')
      return
    }
    if (!odfi.routingNumber.replace(/\D/g, '').length) {
      setError('Enter your bank routing number (ODFI).')
      return
    }

    // Validate all included rows have bank details
    for (const row of selectedRows) {
      if (!row.rdfiRouting.replace(/\D/g, '')) {
        setError(`Missing routing number for ${row.payer ?? row.id}`)
        return
      }
      if (!row.rdfiAccount.trim()) {
        setError(`Missing account number for ${row.payer ?? row.id}`)
        return
      }
    }

    setGenerating(true)
    try {
      const config = {
        odfiBankRoutingNumber: odfi.routingNumber.replace(/\D/g, ''),
        odfiBankName: odfi.bankName,
        companyName: odfi.companyName.slice(0, 16),
        companyId: odfi.companyId.slice(0, 10).padEnd(10),
        entryDescription: odfi.entryDescription.slice(0, 10),
        effectiveDate: odfi.effectiveDate,
        fileIdModifier: odfi.fileIdModifier,
      }

      const entries = selectedRows.map(row => ({
        rdfiRoutingNumber: row.rdfiRouting.replace(/\D/g, ''),
        rdfiAccountNumber: row.rdfiAccount.trim(),
        amountCents: Math.round((row.amount ?? 0) * 100),
        individualId: String(row.id).slice(0, 15),
        individualName: (row.payer ?? 'TENANT').slice(0, 22),
        transactionCode: row.txCode,
      }))

      const res = await fetch('/api/ach-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-azure-token': azureToken,
        },
        body: JSON.stringify({ config, entries }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg)
      }

      // Trigger download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ach-${new Date().toISOString().slice(0, 10)}.ach`
      a.click()
      URL.revokeObjectURL(url)

      setSuccess(
        `ACH file generated: ${selectedRows.length} entries, $${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} total.`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  function signOutAzure() {
    sessionStorage.removeItem('azure_token')
    sessionStorage.removeItem('azure_user')
    setAzureToken(null)
    setAzureUser(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">ACH Export</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>NACHA PPD format</span>
          <span className="text-gray-300">|</span>
          <span>Azure-authenticated</span>
        </div>
      </div>

      {/* ── Azure Auth Banner ─────────────────────────────────────────── */}
      <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${azureToken ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${azureToken ? 'text-green-600' : 'text-amber-500'}`} />
          {azureToken ? (
            <div>
              <p className="text-sm font-medium text-green-800">
                Authenticated with Azure AD{azureUser ? ` — ${azureUser}` : ''}
              </p>
              <p className="text-xs text-green-600">Token verified. Ready to generate ACH files.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-amber-800">Azure AD authentication required</p>
              <p className="text-xs text-amber-600">Sign in with your organization account to authorize ACH file generation.</p>
            </div>
          )}
        </div>
        {azureToken ? (
          <button
            onClick={signOutAzure}
            className="text-xs text-gray-500 hover:text-red-600 underline whitespace-nowrap"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={startAzureLogin}
            disabled={azureLoading}
            className="flex items-center gap-2 bg-[#0078d4] text-white px-4 py-2 rounded-lg hover:bg-[#006cbf] disabled:opacity-60 text-sm font-medium whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            {azureLoading ? 'Authenticating…' : 'Sign in with Azure'}
          </button>
        )}
      </div>

      {/* ── ODFI Configuration ────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Bank (ODFI) Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field
            label="Bank Routing Number (9 digits)"
            value={odfi.routingNumber}
            placeholder="021000021"
            onChange={v => setOdfi(o => ({ ...o, routingNumber: v }))}
            maxLength={9}
          />
          <Field
            label="Bank Name (max 23 chars)"
            value={odfi.bankName}
            placeholder="Chase Bank"
            onChange={v => setOdfi(o => ({ ...o, bankName: v }))}
            maxLength={23}
          />
          <Field
            label="Company Name (max 16 chars)"
            value={odfi.companyName}
            onChange={v => setOdfi(o => ({ ...o, companyName: v }))}
            maxLength={16}
          />
          <Field
            label="Company ID (1 + EIN, 10 chars)"
            value={odfi.companyId}
            placeholder="1742012345"
            onChange={v => setOdfi(o => ({ ...o, companyId: v }))}
            maxLength={10}
            hint="Convention: '1' followed by your 9-digit EIN"
          />
          <Field
            label="Entry Description (max 10 chars)"
            value={odfi.entryDescription}
            onChange={v => setOdfi(o => ({ ...o, entryDescription: v }))}
            maxLength={10}
            hint="Shown on tenant's bank statement"
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              value={odfi.effectiveDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setOdfi(o => ({ ...o, effectiveDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              File ID Modifier
            </label>
            <select
              value={odfi.fileIdModifier}
              onChange={e => setOdfi(o => ({ ...o, fileIdModifier: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
            >
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Increment for multiple files on the same day</p>
          </div>
        </div>
      </div>

      {/* ── Entry Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Receipts to Include</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedRows.length} selected — ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setRows(r => r.map(row => ({ ...row, included: true })))}
              className="text-xs text-[#b22625] hover:underline"
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setRows(r => r.map(row => ({ ...row, included: false })))}
              className="text-xs text-gray-500 hover:underline"
            >
              Deselect all
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">No receipts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property / Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TX Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenant Routing # <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenant Account # <span className="text-red-500">*</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(row => (
                  <tr key={row.id} className={row.included ? 'bg-white' : 'bg-gray-50 opacity-60'}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={e => updateRow(row.id, { included: e.target.checked })}
                        className="rounded border-gray-300 text-[#b22625] focus:ring-[#b22625]"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {row.date ? new Date(row.date + 'T00:00').toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.payer ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {row.property_name}{row.unit_number ? ` · ${row.unit_number}` : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">
                      ${Number(row.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.txCode}
                        disabled={!row.included}
                        onChange={e => updateRow(row.id, { txCode: e.target.value as EntryRow['txCode'] })}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#b22625] disabled:bg-gray-100"
                      >
                        <option value="27">27 — Checking Debit</option>
                        <option value="22">22 — Checking Credit</option>
                        <option value="37">37 — Savings Debit</option>
                        <option value="32">32 — Savings Credit</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.rdfiRouting}
                        disabled={!row.included}
                        onChange={e => updateRow(row.id, { rdfiRouting: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="123456789"
                        maxLength={9}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#b22625] disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.rdfiAccount}
                        disabled={!row.included}
                        onChange={e => updateRow(row.id, { rdfiAccount: e.target.value.replace(/[^0-9\-]/g, '').slice(0, 17) })}
                        placeholder="Acct number"
                        maxLength={17}
                        className="w-36 border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#b22625] disabled:bg-gray-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Status messages ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* ── Action bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{selectedRows.length}</span> entries ·{' '}
          <span className="font-semibold text-green-600">
            ${(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>{' '}
          total debit
        </div>
        <button
          onClick={generateAch}
          disabled={generating || !azureToken || selectedRows.length === 0}
          className="flex items-center gap-2 bg-[#b22625] text-white px-6 py-2.5 rounded-lg hover:bg-[#8a1d1c] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          {generating ? 'Generating…' : 'Generate ACH File (.ach)'}
        </button>
      </div>

      {/* ── Info panel ────────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">About NACHA ACH Files</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>PPD (Prearranged Payment and Deposit) entries — standard for recurring rent collection.</li>
          <li>Transaction code <strong>27</strong> = debit tenant's checking account (pull rent).</li>
          <li>Effective date should be the next business day (your bank may require 1–2 business days lead time).</li>
          <li>Upload the generated <code>.ach</code> file to your bank's ACH portal or transmit via SFTP.</li>
          <li>Retain signed ACH authorization forms from each tenant before debiting their accounts.</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, maxLength, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

/** Returns next Monday–Friday relative to today (YYYY-MM-DD). */
function nextBusinessDay(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
