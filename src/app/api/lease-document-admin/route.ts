import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  // Verify admin is authenticated
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate signed URL using service role key (60 minute expiry)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await serviceSupabase
    .storage
    .from('lease-docs')
    .createSignedUrl(filePath, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
