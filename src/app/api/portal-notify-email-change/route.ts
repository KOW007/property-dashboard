/**
 * POST /api/portal-notify-email-change
 *
 * Sends a security notification to a tenant's OLD email address when they
 * request an email change. Called client-side after supabase.auth.updateUser().
 * Requires an active session — tenants only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Always send to the verified auth email — never trust the client's claimed address
  const oldEmail = user.email
  if (!oldEmail) return NextResponse.json({ error: 'No email on account' }, { status: 400 })

  const { newEmail } = await req.json().catch(() => ({}))
  if (!newEmail) return NextResponse.json({ error: 'newEmail is required' }, { status: 400 })

  await sendEmail({
    to: oldEmail,
    subject: 'Email change requested for your Spearhead Properties account',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#2d2d2d;padding:20px 24px">
          <h1 style="color:#fff;margin:0;font-size:20px">Spearhead Properties</h1>
        </div>
        <div style="padding:32px 24px;border:1px solid #eee;border-top:none">
          <h2 style="color:#2d2d2d;margin-top:0">Email change requested</h2>
          <p style="color:#555;font-size:15px">
            We received a request to change the email address on your tenant portal account
            from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.
          </p>
          <p style="color:#555;font-size:15px">
            A confirmation link has been sent to <strong>${newEmail}</strong>.
            The change will only take effect once that link is clicked.
          </p>
          <div style="background:#fff8f8;border:1px solid #f5c6c6;border-radius:8px;padding:16px;margin:24px 0">
            <p style="color:#b22625;font-size:14px;margin:0;font-weight:600">
              Didn't request this change?
            </p>
            <p style="color:#555;font-size:14px;margin:8px 0 0">
              If you did not make this request, please contact us immediately at
              <a href="mailto:info@spearheadproperties.com" style="color:#b22625">
                info@spearheadproperties.com
              </a>
              or call <a href="tel:5122361512" style="color:#b22625">(512) 236-1512</a>.
            </p>
          </div>
        </div>
        <p style="font-size:11px;color:#aaa;padding:16px 24px 0">
          Spearhead Properties &mdash; Do not reply to this email.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
