import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.unit_number  !== undefined) update.unit_number  = body.unit_number
  if (body.bedrooms     !== undefined) update.bedrooms     = body.bedrooms     === '' ? null : Number(body.bedrooms)
  if (body.bathrooms    !== undefined) update.bathrooms    = body.bathrooms    === '' ? null : Number(body.bathrooms)
  if (body.square_feet  !== undefined) update.square_feet  = body.square_feet  === '' ? null : Number(body.square_feet)
  if (body.market_rent  !== undefined) update.market_rent  = body.market_rent  === '' ? null : Number(body.market_rent)
  if (body.hide_from_public !== undefined) update.hide_from_public = !!body.hide_from_public

  const { error } = await supabase.from('units').update(update).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
