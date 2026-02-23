import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://property-dashboard-beige.vercel.app'}/portal`,
      },
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send password reset' }, { status: 500 })
  }
}
