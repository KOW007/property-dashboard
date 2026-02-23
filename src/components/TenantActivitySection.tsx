'use client'

import { useState } from 'react'
import TenantActivityForm from './TenantActivityForm'

interface Activity {
  id: string
  date: string
  all_day: boolean
  time: string | null
  description: string | null
  label: string | null
  assign_to: string | null
  status: string | null
}

interface Props {
  tenantId: string
  tenantName: string
  activities: Activity[]
}

const fmt = (val: string | null | undefined) => {
  if (!val) return '—'
  // Append T00:00 to treat date-only strings as local time, not UTC
  const d = val.includes('T') ? new Date(val) : new Date(val + 'T00:00')
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function actStatusColor(status: string | null) {
  if (!status) return 'bg-gray-100 text-gray-700'
  if (status === 'Pending') return 'bg-yellow-100 text-yellow-800'
  if (status === 'In Progress') return 'bg-blue-100 text-blue-800'
  if (status === 'Completed') return 'bg-green-100 text-green-800'
  if (status === 'Cancelled') return 'bg-gray-100 text-gray-700'
  return 'bg-gray-100 text-gray-700'
}

function formatTime(a: Activity) {
  if (a.all_day || !a.time) return 'All Day'
  const [h, m] = a.time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:${m} ${ampm}`
}

export default function TenantActivitySection({ tenantId, tenantName, activities }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const handleEdit = (activity: Activity) => {
    setShowForm(false)
    setEditingActivity(activity)
  }

  const handleCloseEdit = () => {
    setEditingActivity(null)
  }

  const handleCloseNew = () => {
    setShowForm(false)
  }

  return (
    <>
      {/* Edit form */}
      {editingActivity && (
        <TenantActivityForm
          tenantId={tenantId}
          tenantName={tenantName}
          activity={editingActivity}
          onClose={handleCloseEdit}
        />
      )}

      {/* New form */}
      {showForm && !editingActivity && (
        <TenantActivityForm
          tenantId={tenantId}
          tenantName={tenantName}
          onClose={handleCloseNew}
        />
      )}

      {/* Add button */}
      {!showForm && !editingActivity && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs px-3 py-1 rounded font-medium bg-[#b22625] text-white hover:bg-[#8a1d1c] mb-4"
        >
          + Add Activity
        </button>
      )}

      {/* Table */}
      {activities.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activities.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{fmt(a.date)}</td>
                  <td className="px-4 py-2 text-gray-500">{formatTime(a)}</td>
                  <td className="px-4 py-2 text-gray-900">{a.description || '—'}</td>
                  <td className="px-4 py-2">
                    {a.label ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">{a.label}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{a.assign_to || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actStatusColor(a.status)}`}>
                      {a.status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-xs text-[#b22625] hover:underline font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-4 text-sm text-gray-400 text-center">No activities recorded.</p>
      )}
    </>
  )
}
