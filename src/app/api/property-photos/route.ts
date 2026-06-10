import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const BUCKET = 'property-photos'

function getServiceSupabase() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('Supabase service role not configured')
  return createClient(url, secret, { auth: { persistSession: false } })
}

async function requireAdmin() {
  const auth = await createSupabaseServer()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

// POST — upload a photo
// Body: FormData with fields: file (File), propertyId (string)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file       = form.get('file') as File | null
  const propertyId = form.get('propertyId') as string | null

  if (!file || !propertyId) {
    return NextResponse.json({ error: 'Missing file or propertyId' }, { status: 400 })
  }

  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = getServiceSupabase()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}

// DELETE — remove a photo
// Body: JSON { path: string }  e.g. "property-id/filename.jpg"
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await req.json()
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const supabase = getServiceSupabase()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
