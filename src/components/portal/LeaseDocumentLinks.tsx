'use client'

import { useState } from 'react'

interface Props {
  filePath: string
}

export default function LeaseDocumentLinks({ filePath }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getSignedUrl = async (): Promise<string | null> => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lease-document?path=${encodeURIComponent(filePath)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load document')
      return data.url
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleView = async () => {
    const url = await getSignedUrl()
    if (url) window.open(url, '_blank')
  }

  const handleDownload = async () => {
    const url = await getSignedUrl()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filePath.split('/').pop() || 'lease.pdf'
    a.click()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleView}
        disabled={loading}
        className="text-xs text-[#b22625] hover:underline font-medium disabled:opacity-50"
      >
        {loading ? '...' : '👁 View'}
      </button>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="text-xs text-[#b22625] hover:underline font-medium disabled:opacity-50"
      >
        {loading ? '...' : '⬇ Download'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
