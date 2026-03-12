'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type FollowUp = { label: string; key: string; options: string[] }
type CategoryConfig = { followUps: FollowUp[] }

const ISSUE_CATEGORIES: Record<string, CategoryConfig> = {
  'Plumbing': {
    followUps: [
      { label: 'Which fixture?', key: 'fixture', options: ['Toilet', 'Bathroom sink', 'Kitchen sink', 'Shower/Tub', 'Water heater', 'Other'] },
      { label: 'Is it actively leaking?', key: 'leaking', options: ['Yes', 'No'] },
    ],
  },
  'Electrical': {
    followUps: [
      { label: 'What type of issue?', key: 'issue_type', options: ['Outlet not working', 'Light fixture', 'Breaker tripped', 'Ceiling fan', 'Other'] },
      { label: 'Is it a safety hazard?', key: 'safety_hazard', options: ['Yes — sparks/burning smell', 'No'] },
    ],
  },
  'Heating / Cooling': {
    followUps: [
      { label: "What's the problem?", key: 'hvac_problem', options: ['Not heating', 'Not cooling', 'Strange noise', 'Thermostat issue', 'Other'] },
    ],
  },
  'Appliance': {
    followUps: [
      { label: 'Which appliance?', key: 'appliance', options: ['Refrigerator', 'Stove/Oven', 'Dishwasher', 'Washer', 'Dryer', 'Microwave', 'Other'] },
    ],
  },
  'Doors & Windows': {
    followUps: [
      { label: 'Which item?', key: 'item', options: ['Front door', 'Bedroom door', 'Sliding door', 'Window', 'Screen', 'Other'] },
      { label: "What's the issue?", key: 'door_issue', options: ["Won't lock/unlock", "Won't open/close", 'Broken glass', 'Drafty', 'Other'] },
    ],
  },
  'Pest Control': {
    followUps: [
      { label: 'What type of pest?', key: 'pest_type', options: ['Roaches', 'Mice/Rats', 'Ants', 'Bedbugs', 'Wasps/Bees', 'Other'] },
    ],
  },
  'Locks & Keys': {
    followUps: [
      { label: 'Which lock/door?', key: 'lock_location', options: ['Front door', 'Back door', 'Mailbox', 'Other'] },
    ],
  },
  'Other': {
    followUps: [],
  },
}

export default function MaintenanceRequestForm({ unitId, tenantId }: { unitId: string; tenantId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('')
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({})
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [permissionToEnter, setPermissionToEnter] = useState<boolean | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const followUps = category ? (ISSUE_CATEGORIES[category]?.followUps ?? []) : []

  const buildTitle = () => {
    if (!category) return ''
    const parts = [category]
    for (const fu of followUps) {
      const answer = followUpAnswers[fu.key]
      if (answer) parts.push(answer)
    }
    return parts.join(' — ')
  }

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setFollowUpAnswers({})
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const combined = [...photos, ...files].slice(0, 5)
    setPhotos(combined)
    setPreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    const next = photos.filter((_, i) => i !== index)
    setPhotos(next)
    setPreviews(next.map(f => URL.createObjectURL(f)))
  }

  const resetForm = () => {
    setCategory('')
    setFollowUpAnswers({})
    setDescription('')
    setPriority('medium')
    setPermissionToEnter(null)
    setPhotos([])
    setPreviews([])
    setUploadProgress('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (permissionToEnter === null) {
      alert('Please indicate whether we have permission to enter.')
      return
    }
    setSubmitting(true)

    // Upload photos to Supabase Storage
    const photoUrls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}...`)
      const ext = file.name.split('.').pop()
      const path = `${unitId}/${Date.now()}-${i}.${ext}`
      const { data, error } = await supabase.storage
        .from('maintenance-photos')
        .upload(path, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('maintenance-photos').getPublicUrl(data.path)
        photoUrls.push(urlData.publicUrl)
      }
    }

    setUploadProgress('')

    await supabase.from('maintenance_requests').insert([{
      unit_id: unitId,
      tenant_id: tenantId,
      title: buildTitle(),
      description,
      priority,
      permission_to_enter: permissionToEnter,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      status: 'open',
      reported_date: new Date().toISOString(),
    }])

    setSubmitting(false)
    setShowForm(false)
    resetForm()
    router.refresh()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b22625]'

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-[#2d2d2d] text-white py-2.5 rounded-lg hover:bg-black font-medium text-sm transition-colors"
      >
        Request Maintenance
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-800 text-sm">New Maintenance Request</h3>

      {/* Issue Category */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Issue Type *</label>
        <select
          required
          value={category}
          onChange={e => handleCategoryChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Select issue type...</option>
          {Object.keys(ISSUE_CATEGORIES).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Follow-up questions */}
      {followUps.map(fu => (
        <div key={fu.key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{fu.label} *</label>
          <select
            required
            value={followUpAnswers[fu.key] ?? ''}
            onChange={e => setFollowUpAnswers(prev => ({ ...prev, [fu.key]: e.target.value }))}
            className={inputClass}
          >
            <option value="">Select...</option>
            {fu.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Additional Details</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Please describe the issue in more detail..."
          className={inputClass}
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
        <select value={priority} onChange={e => setPriority(e.target.value)} className={inputClass}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {/* Permission to Enter */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Permission to Enter? *</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={permissionToEnter === true}
              onChange={() => setPermissionToEnter(true)}
            />
            Yes, you may enter
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={permissionToEnter === false}
              onChange={() => setPermissionToEnter(false)}
            />
            No, please call to schedule first
          </label>
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Photos of Issue (optional, up to 5)</p>
        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600"
          >
            + Add Photo(s)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoChange}
        />
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadProgress && <p className="text-xs text-gray-500">{uploadProgress}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-[#2d2d2d] text-white py-2 rounded-lg hover:bg-black disabled:bg-gray-400 font-medium text-sm"
        >
          {submitting ? (uploadProgress || 'Submitting...') : 'Submit Request'}
        </button>
        <button
          type="button"
          onClick={() => { setShowForm(false); resetForm() }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
