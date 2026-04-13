/**
 * POST /api/ach-webhook
 *
 * Receives ACH event notifications from the bank. Each request is validated
 * with two independent security checks before any data is written:
 *
 *   1. HMAC-SHA256 signature  — proves payload came from the bank (not forged)
 *   2. Azure AD Bearer token  — proves the caller is the bank's service principal
 *
 * Required env vars:
 *   ACH_WEBHOOK_SECRET    — shared secret agreed with the bank (HMAC signing)
 *   BANK_AZURE_TENANT_ID  — bank's Azure AD tenant GUID
 *   BANK_AZURE_CLIENT_ID  — bank's service principal client ID
 *   AZURE_CLIENT_ID       — Spearhead's app client ID (token audience)
 *   OUTLOOK_USER          — noreply@spearheadproperties.com
 *   OUTLOOK_PASSWORD      — shared mailbox password
 *   ADMIN_ALERT_EMAIL     — email address to notify on returns/NOCs
 *
 * Supabase table required:
 *   See supabase/ach_transactions.sql
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { verifyBankAzureToken, extractBearerToken } from '@/lib/azure-auth'
import { getReturnCode, getNocDescription } from '@/lib/nacha-returns'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// ─── HMAC verification ────────────────────────────────────────────────────────

function verifyHmacSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(signatureHeader)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ─── Timestamp replay guard (±5 minutes) ─────────────────────────────────────

function isTimestampFresh(timestamp: string): boolean {
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return false
  const diffSeconds = Math.abs(Date.now() / 1000 - ts)
  return diffSeconds < 300
}

// ─── Email alert ──────────────────────────────────────────────────────────────

async function sendReturnAlert(payload: AchWebhookPayload) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) return

  const returnInfo = payload.returnCode ? getReturnCode(payload.returnCode) : null
  const amount = ((payload.amountCents ?? 0) / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD'
  })

  const isReturn = payload.eventType === 'ach.return'
  const isNoc    = payload.eventType === 'ach.noc'

  const subject = isReturn
    ? `ACH Return ${payload.returnCode}: ${payload.individualName} — ${amount}`
    : isNoc
    ? `ACH Notice of Change: ${payload.individualName}`
    : `ACH Settlement: ${payload.individualName} — ${amount}`

  const actionHtml = returnInfo
    ? `<p><strong>Recommended Action:</strong> ${returnInfo.action}</p>`
    : payload.nocCode
    ? `<p><strong>Action Required:</strong> ${getNocDescription(payload.nocCode)}</p>`
    : ''

  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://property-dashboard-beige.vercel.app'}/accounting/ach-transactions`

  await sendEmail({
    to: adminEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#b22625;padding:16px 24px">
          <h1 style="color:#fff;margin:0;font-size:18px">Spearhead Properties — ACH Alert</h1>
        </div>
        <div style="padding:24px;border:1px solid #eee;border-top:none">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#666;width:160px">Event</td>
                <td style="padding:6px 0;font-weight:600">${subject}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Tenant</td>
                <td style="padding:6px 0">${payload.individualName}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Amount</td>
                <td style="padding:6px 0">${amount}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Trace #</td>
                <td style="padding:6px 0;font-family:monospace">${payload.traceNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Effective Date</td>
                <td style="padding:6px 0">${payload.effectiveDate}</td></tr>
            ${returnInfo ? `
            <tr><td style="padding:6px 0;color:#666">Return Code</td>
                <td style="padding:6px 0;color:#b22625;font-weight:600">
                  ${payload.returnCode} — ${returnInfo.description}
                </td></tr>` : ''}
          </table>
          ${actionHtml}
          <div style="margin-top:24px">
            <a href="${dashboardUrl}"
               style="background:#b22625;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
              View in Dashboard
            </a>
          </div>
        </div>
        <p style="font-size:11px;color:#aaa;padding:16px 0">
          Spearhead Properties &mdash; Automated ACH notification. Do not reply to this email.
        </p>
      </div>
    `,
  })
}

// ─── Webhook payload type ─────────────────────────────────────────────────────

interface AchWebhookPayload {
  eventId: string
  eventType: 'ach.settlement' | 'ach.return' | 'ach.noc'
  timestamp: string
  traceNumber: string
  returnCode?: string
  nocCode?: string
  returnDescription?: string
  amountCents: number
  individualId?: string
  individualName: string
  effectiveDate: string
  originalEffectiveDate?: string
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Read raw body first — needed for HMAC verification before JSON.parse
  const rawBody = await req.text()

  // ── 1. Timestamp freshness (replay attack guard) ───────────────────────
  const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
  if (!isTimestampFresh(timestamp)) {
    return NextResponse.json(
      { error: 'Request timestamp is too old or missing. Possible replay attack.' },
      { status: 401 }
    )
  }

  // ── 2. HMAC signature verification ────────────────────────────────────
  const secret = process.env.ACH_WEBHOOK_SECRET
  if (!secret) {
    console.error('ACH_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('x-webhook-signature') ?? ''
  if (!verifyHmacSignature(secret, timestamp, rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  // ── 3. Azure AD token verification (bank service principal) ───────────
  const bankToken = extractBearerToken(req.headers.get('authorization'))
  if (!bankToken) {
    return NextResponse.json({ error: 'Missing Authorization header.' }, { status: 401 })
  }

  try {
    await verifyBankAzureToken(bankToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token invalid'
    return NextResponse.json({ error: `Azure token rejected: ${message}` }, { status: 403 })
  }

  // ── 4. Parse payload ───────────────────────────────────────────────────
  let payload: AchWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!payload.eventId || !payload.eventType || !payload.traceNumber) {
    return NextResponse.json(
      { error: 'Missing required fields: eventId, eventType, traceNumber.' },
      { status: 400 }
    )
  }

  // ── 5. Persist to Supabase (unique constraint on event_id handles idempotency) ──
  const supabase = await createSupabaseServer()
  const returnInfo = payload.returnCode ? getReturnCode(payload.returnCode) : null

  const { error: insertError } = await supabase.from('ach_transactions').insert({
    event_id:              payload.eventId,
    event_type:            payload.eventType,
    trace_number:          payload.traceNumber,
    return_code:           payload.returnCode ?? null,
    return_description:    returnInfo?.description ?? payload.returnDescription ?? null,
    return_action:         returnInfo?.action ?? null,
    return_severity:       returnInfo?.severity ?? null,
    noc_code:              payload.nocCode ?? null,
    noc_description:       payload.nocCode ? getNocDescription(payload.nocCode) : null,
    amount_cents:          payload.amountCents,
    individual_id:         payload.individualId ?? null,
    individual_name:       payload.individualName,
    effective_date:        payload.effectiveDate,
    original_effective_date: payload.originalEffectiveDate ?? null,
    raw_payload:           payload,
  })

  if (insertError) {
    // Unique constraint violation = duplicate event — return 200 so bank stops retrying
    if (insertError.code === '23505') {
      return NextResponse.json({ status: 'already_processed', eventId: payload.eventId })
    }
    console.error('ACH webhook insert error:', insertError.code)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // ── 7. Email alert for returns and NOCs ────────────────────────────────
  if (payload.eventType === 'ach.return' || payload.eventType === 'ach.noc') {
    try {
      await sendReturnAlert(payload)
    } catch (emailErr) {
      // Don't fail the webhook if email fails — log and continue
      console.error('ACH alert email failed:', emailErr)
    }
  }

  return NextResponse.json({ status: 'ok', eventId: payload.eventId }, { status: 200 })
}
