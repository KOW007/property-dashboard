import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

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

    // Generate the password reset link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://property-dashboard-beige.vercel.app'}/portal`,
      },
    })

    if (error) throw error

    const actionLink = data.properties?.action_link
    if (!actionLink) throw new Error('Failed to generate reset link')

    // Extract the token_hash from Supabase's URL and build our own branded link
    const supabaseUrl = new URL(actionLink)
    const tokenHash = supabaseUrl.searchParams.get('token')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://property-dashboard-beige.vercel.app'
    const resetUrl = `${siteUrl}/reset-password?token=${tokenHash}&type=recovery`

    // Send via Microsoft Graph so it comes from noreply@spearheadproperties.com
    await sendEmail({
      to: email,
      subject: 'Reset your Spearhead Properties password',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#2d2d2d;padding:20px 24px">
            <h1 style="color:#fff;margin:0;font-size:20px">Spearhead Properties</h1>
          </div>
          <div style="padding:32px 24px;border:1px solid #eee;border-top:none">
            <h2 style="color:#2d2d2d;margin-top:0">Reset your password</h2>
            <p style="color:#555;font-size:15px">
              We received a request to reset your password for your tenant portal account.
              Click the button below to choose a new password.
            </p>
            <div style="margin:32px 0">
              <a href="${resetUrl}"
                 style="background:#b22625;color:#fff;padding:12px 28px;border-radius:6px;
                        text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
                Reset Password
              </a>
            </div>
            <p style="color:#888;font-size:13px">
              This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
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
    console.error('Password reset error:', error.message ?? error)
    return NextResponse.json({ error: error.message || 'Failed to send password reset' }, { status: 500 })
  }
}
