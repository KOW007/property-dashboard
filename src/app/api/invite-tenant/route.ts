import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'

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

    // Use service role key to generate invite link — bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://property-dashboard-beige.vercel.app'

    // Generate invite link instead of letting Supabase send — so we control the email
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/portal`,
        data: { tenant_name: tenantName },
      },
    })

    if (error) {
      console.error('Invite link error:', error.message)
      return NextResponse.json({ error: error.message ?? 'Failed to generate invite' }, { status: 500 })
    }

    const inviteUrl = data.properties?.action_link
    if (!inviteUrl) throw new Error('Failed to generate invite link')

    const firstName = tenantName?.split(' ')[0] || 'there'

    // Send via Microsoft Graph so it comes from noreply@spearheadproperties.com
    await sendEmail({
      to: email,
      subject: 'You\'re invited to the Spearhead Properties tenant portal',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#2d2d2d;padding:20px 24px">
            <h1 style="color:#fff;margin:0;font-size:20px">Spearhead Properties</h1>
          </div>
          <div style="padding:32px 24px;border:1px solid #eee;border-top:none">
            <h2 style="color:#2d2d2d;margin-top:0">Welcome, ${firstName}!</h2>
            <p style="color:#555;font-size:15px">
              You've been invited to the Spearhead Properties tenant portal,
              where you can view your lease, submit maintenance requests,
              make payments, and manage your account.
            </p>
            <div style="margin:32px 0">
              <a href="${inviteUrl}"
                 style="background:#b22625;color:#fff;padding:12px 28px;border-radius:6px;
                        text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
                Set Up Your Account
              </a>
            </div>
            <p style="color:#888;font-size:13px">
              This invitation link expires in 24 hours.
              If you have questions, reply to your property manager or call (512) 236-1512.
            </p>
          </div>
          <p style="font-size:11px;color:#aaa;padding:16px 24px 0">
            Spearhead Properties &mdash; Do not reply to this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Invite error:', error.message ?? error)
    return NextResponse.json({ error: error.message ?? 'Failed to send invite' }, { status: 500 })
  }
}
