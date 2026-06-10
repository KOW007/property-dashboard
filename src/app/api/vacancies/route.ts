import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const [{ data, error }, { data: hiddenUnits }] = await Promise.all([
    supabase
      .from('current_vacancies')
      .select('unit_id, property_name, unit_number, bedrooms, bathrooms, market_rent')
      .order('property_name')
      .order('unit_number'),
    service.from('units').select('id').eq('hide_from_public', true),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const hiddenIds = new Set((hiddenUnits ?? []).map(u => u.id))
  const visible = (data ?? [])
    .filter(u => !hiddenIds.has(u.unit_id))
    .map(({ property_name, unit_number, bedrooms, bathrooms, market_rent }) =>
      ({ property_name, unit_number, bedrooms, bathrooms, market_rent }))

  return NextResponse.json(visible)
}
