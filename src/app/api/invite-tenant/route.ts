import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    // Verify the caller is an authenticated admin
    const authClient = await createSupabaseServer()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email, tenantName } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Use service role key to send invite — bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://property-dashboard-beige.vercel.app'}/portal`,
      data: { tenant_name: tenantName }
    })

    if (error) {
      console.error('Invite error:', error.message, error.status)
      return NextResponse.json({ error: error.message ?? 'Failed to send invite' }, { status: error.status ?? 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invite error:', error.message ?? error)
    return NextResponse.json({ error: error.message ?? 'Failed to send invite' }, { status: 500 })
  }
}
