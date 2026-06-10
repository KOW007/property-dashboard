'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function HidePublicToggle({ unitId, hidden }: { unitId: string; hidden: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    await fetch(`/api/units/${unitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hide_from_public: !hidden }),
    })
    router.refresh()
    setSaving(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={`mt-4 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
        hidden
          ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      {saving ? 'Saving…' : hidden ? 'Hidden from public site — click to show' : 'Visible on public site — click to hide'}
    </button>
  )
}
