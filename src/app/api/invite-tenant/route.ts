import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, tenantName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
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

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send invite' }, { status: 500 })
  }
}
