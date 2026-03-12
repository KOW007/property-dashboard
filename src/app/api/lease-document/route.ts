import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  // Verify tenant is authenticated
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Confirm this lease document belongs to the logged-in tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
  }

  const { data: lease } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('document_url', filePath)
    .single()

  if (!lease) {
    return NextResponse.json({ error: 'Document not found or not authorized' }, { status: 403 })
  }

  // Generate signed URL using service role key (60 minute expiry)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const bucketMarker = '/lease-docs/'
  const storagePath = filePath.includes(bucketMarker)
    ? filePath.split(bucketMarker).slice(1).join(bucketMarker)
    : filePath

  const { data, error } = await serviceSupabase
    .storage
    .from('lease-docs')
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
