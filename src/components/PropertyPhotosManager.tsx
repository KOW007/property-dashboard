'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, Upload, ChevronDown, ChevronRight } from 'lucide-react'

const BUCKET = 'property-photos'

interface Property { id: string; name: string }

export default function PropertyPhotosManager({ properties }: { properties: Property[] }) {
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [photos, setPhotos]       = useState<Record<string, string[]>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadPhotos = async (propertyId: string) => {
    setLoadingId(propertyId)
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(propertyId, { sortBy: { column: 'created_at', order: 'asc' } })
    const urls = (data ?? [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => supabase.storage.from(BUCKET).getPublicUrl(`${propertyId}/${f.name}`).data.publicUrl)
    setPhotos(prev => ({ ...prev, [propertyId]: urls }))
    setLoadingId(null)
  }

  const handleToggle = (propertyId: string) => {
    if (expanded === propertyId) { setExpanded(null); return }
    setExpanded(propertyId)
    if (!photos[propertyId]) loadPhotos(propertyId)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!expanded || !e.target.files?.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(e.target.files)) {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${expanded}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, file)
      if (!error && data) {
        newUrls.push(supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl)
      }
    }
    setPhotos(prev => ({ ...prev, [expanded]: [...(prev[expanded] ?? []), ...newUrls] }))
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (propertyId: string, url: string) => {
    setDeleting(url)
    const path = url.split(`/object/public/${BUCKET}/`)[1]
    if (path) await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)])
    setPhotos(prev => ({ ...prev, [propertyId]: (prev[propertyId] ?? []).filter(u => u !== url) }))
    setDeleting(null)
  }

  return (
    <div className="space-y-2">
      {properties.map(prop => {
        const isOpen    = expanded === prop.id
        const propPhotos = photos[prop.id] ?? []

        return (
          <div key={prop.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => handleToggle(prop.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">{prop.name}</span>
              <div className="flex items-center gap-3">
                {photos[prop.id] !== undefined && (
                  <span className="text-xs text-gray-400">
                    {propPhotos.length} photo{propPhotos.length !== 1 ? 's' : ''}
                  </span>
                )}
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-gray-400" />
                  : <ChevronRight className="w-4 h-4 text-gray-400" />
                }
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100">
                {loadingId === prop.id ? (
                  <p className="text-sm text-gray-400 py-6 text-center">Loading photos…</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                    {propPhotos.map(url => (
                      <div key={url} className="relative group aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDelete(prop.id, url)}
                          disabled={deleting === url}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-[#b22625] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Upload tile */}
                    <button
                      onClick={() => inputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#b22625] hover:text-[#b22625] transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Add photos'}</span>
                    </button>
                  </div>
                )}

                {!loadingId && propPhotos.length === 0 && (
                  <p className="text-xs text-gray-400 mt-3">No photos yet.</p>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
