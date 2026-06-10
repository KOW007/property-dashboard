'use client'

import { useState } from 'react'

export default function PropertyGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [hero, setHero] = useState(0)
  const [expanded, setExpanded] = useState(false)

  if (photos.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photos[0]} alt={alt} loading="eager" className="w-full object-cover" style={{ height: '340px' }} />
    )
  }

  const extra = photos.length - 5

  return (
    <div>
      <div className="grid gap-0.5 grid-cols-2 grid-rows-2 md:grid-cols-4" style={{ height: '340px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[hero]} alt={alt} loading="eager" className="w-full h-full object-cover col-span-2 row-span-2" />
        {photos.slice(1, 5).map((url, i) => {
          const idx = i + 1
          const showMore = i === 3 && extra > 0 && !expanded
          return (
            <button
              key={url}
              type="button"
              onClick={() => (showMore ? setExpanded(true) : setHero(idx))}
              className="relative hidden md:block cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="eager" className="w-full h-full object-cover" />
              {showMore && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{extra} more</span>
                </div>
              )}
              {hero === idx && <div className="absolute inset-0 border-2 border-[#b22625] pointer-events-none" />}
            </button>
          )
        })}
      </div>
      {expanded && (
        <div className="hidden md:grid grid-cols-8 gap-0.5 mt-0.5">
          {photos.slice(5).map((url, i) => {
            const idx = i + 5
            return (
              <button key={url} type="button" onClick={() => setHero(idx)} className="relative aspect-square cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                {hero === idx && <div className="absolute inset-0 border-2 border-[#b22625] pointer-events-none" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
