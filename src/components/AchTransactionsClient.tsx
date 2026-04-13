'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

interface AchTransaction {
  id: string
  event_id: string
  event_type: string
  trace_number: string
  return_code: string | null
  return_description: string | null
  return_action: string | null
  return_severity: string | null
  noc_code: string | null
  noc_description: string | null
  amount_cents: number
  individual_id: string | null
  individual_name: string
  effective_date: string
  received_at: string
}

type Filter = 'all' | 'ach.settlement' | 'ach.return' | 'ach.noc'

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export default function AchTransactionsClient({
  transactions,
}: {
  transactions: AchTransaction[]
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = transactions.filter(
    t => filter === 'all' || t.event_type === filter
  )

  const counts = {
    settled: transactions.filter(t => t.event_type === 'ach.settlement').length,
    returned: transactions.filter(t => t.event_type === 'ach.return').length,
    noc: transactions.filter(t => t.event_type === 'ach.noc').length,
  }

  const totalSettledCents = transactions
    .filter(t => t.event_type === 'ach.settlement')
    .reduce((s, t) => s + t.amount_cents, 0)

  const totalReturnedCents = transactions
    .filter(t => t.event_type === 'ach.return')
    .reduce((s, t) => s + t.amount_cents, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">ACH Transactions</h2>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Settled"
          count={counts.settled}
          amount={totalSettledCents}
          color="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <SummaryCard
          label="Returned"
          count={counts.returned}
          amount={totalReturnedCents}
          color="red"
          icon={<XCircle className="w-5 h-5" />}
        />
        <SummaryCard
          label="Notice of Change"
          count={counts.noc}
          color="amber"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'ach.settlement', 'ach.return', 'ach.noc'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#b22625] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}
          >
            {f === 'all' ? 'All' :
             f === 'ach.settlement' ? `Settled (${counts.settled})` :
             f === 'ach.return' ? `Returned (${counts.returned})` :
             `NOC (${counts.noc})`}
          </button>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400">
            No transactions found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(tx => {
                const isExpanded = expanded === tx.id
                const severity = tx.return_severity as 'high' | 'medium' | 'low' | null

                return (
                  <>
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : tx.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(tx.received_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {tx.individual_name}
                        {tx.individual_id && (
                          <div className="text-xs text-gray-400 font-mono">{tx.individual_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EventBadge eventType={tx.event_type} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                        <span className={tx.event_type === 'ach.settlement' ? 'text-green-600' : 'text-gray-900'}>
                          {formatCents(tx.amount_cents)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tx.return_code ? (
                          <span className={`font-mono font-bold ${severityColor(severity)}`}>
                            {tx.return_code}
                          </span>
                        ) : tx.noc_code ? (
                          <span className="font-mono text-amber-600 font-bold">{tx.noc_code}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {tx.return_action ? (
                          <div className="flex items-start gap-1.5">
                            <SeverityDot severity={severity} />
                            <span className="text-gray-700 text-xs leading-snug line-clamp-2">
                              {tx.return_action}
                            </span>
                          </div>
                        ) : tx.noc_description ? (
                          <span className="text-amber-700 text-xs leading-snug">
                            {tx.noc_description}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No action required</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${tx.id}-detail`} className="bg-blue-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <Detail label="Trace Number" value={tx.trace_number} mono />
                            <Detail label="Effective Date" value={tx.effective_date} />
                            <Detail label="Event ID" value={tx.event_id} mono />
                            {tx.return_code && (
                              <Detail
                                label="Return Description"
                                value={`${tx.return_code} — ${tx.return_description}`}
                              />
                            )}
                            {tx.return_action && (
                              <div className="col-span-2 md:col-span-4">
                                <p className="text-gray-500 mb-1 font-medium">Recommended Action</p>
                                <p className="text-gray-800">{tx.return_action}</p>
                              </div>
                            )}
                            {tx.noc_description && (
                              <div className="col-span-2 md:col-span-4">
                                <p className="text-gray-500 mb-1 font-medium">NOC — Action Required</p>
                                <p className="text-amber-800">{tx.noc_description}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
        <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          {filter !== 'all' ? ` (filtered)` : ''}
          {' — Click any row to expand details'}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label, count, amount, color, icon,
}: {
  label: string
  count: number
  amount?: number
  color: 'green' | 'red' | 'amber'
  icon: React.ReactNode
}) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red:   'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  }
  const numColors = {
    green: 'text-green-800',
    red:   'text-red-800',
    amber: 'text-amber-800',
  }

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-sm font-medium">{label}</span></div>
      <div className={`text-3xl font-bold ${numColors[color]}`}>{count}</div>
      {amount !== undefined && (
        <div className="text-sm mt-1 opacity-80">{formatCents(amount)}</div>
      )}
    </div>
  )
}

function EventBadge({ eventType }: { eventType: string }) {
  if (eventType === 'ach.settlement') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3" /> Settled
      </span>
    )
  }
  if (eventType === 'ach.return') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" /> Returned
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      <AlertTriangle className="w-3 h-3" /> NOC
    </span>
  )
}

function SeverityDot({ severity }: { severity: 'high' | 'medium' | 'low' | null }) {
  if (!severity) return null
  const colors = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-blue-400' }
  return (
    <span className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full ${colors[severity]}`} />
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-gray-500 mb-0.5 font-medium">{label}</p>
      <p className={`text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function severityColor(severity: 'high' | 'medium' | 'low' | null): string {
  if (severity === 'high')   return 'text-red-600'
  if (severity === 'medium') return 'text-amber-600'
  return 'text-gray-700'
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
