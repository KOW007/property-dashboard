import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  // Uses service role so this should only be called from admin context
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('units')
    .select('id, unit_number, property_id, properties(name)')
    .order('unit_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Format for dropdowns
  const formatted = data?.map((u: any) => ({
    id: u.id,
    unit_number: u.unit_number,
    property_name: u.properties?.name,
  })) || []

  return NextResponse.json(formatted)
}
