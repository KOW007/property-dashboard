/**
 * POST /api/ach-resend-emails
 *
 * Resends tenant confirmation emails for a given ACH batch.
 * Reconstructs recipients from boc_references + tenant_bank_info.
 *
 * Body: { batchId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'
import { nextBusinessDay } from '@/lib/business-days'

export const dynamic = 'force-dynamic'

function getServiceSupabase() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('Supabase service role not configured')
  return createClient(url, secret, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabaseAuth = await createSupabaseServer()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { batchId } = await req.json()
  if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 })

  const supabase = getServiceSupabase()

  // ── Load batch ──────────────────────────────────────────────────────────────
  const { data: batch, error: batchErr } = await supabase
    .from('ach_batches')
    .select('id, run_date, payment_days, boc_references')
    .eq('id', batchId)
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  const items: Array<Record<string, unknown>> = batch.boc_references ?? []
  if (items.length === 0) {
    return NextResponse.json({ error: 'No entries found in batch' }, { status: 400 })
  }

  // ── Match individualId → full tenant_id ─────────────────────────────────────
  // individualId in boc_references = tenant_id.slice(0, 15)
  const { data: bankInfos } = await supabase
    .from('tenant_bank_info')
    .select('tenant_id, payment_day')
    .in('payment_day', batch.payment_days ?? [])
    .eq('status', 'active')

  const tenantByIndividualId = new Map<string, string>()
  for (const b of bankInfos ?? []) {
    tenantByIndividualId.set((b.tenant_id as string).slice(0, 15), b.tenant_id as string)
  }

  // ── Load tenant emails ───────────────────────────────────────────────────────
  const tenantIds = [...new Set(
    items
      .map(item => tenantByIndividualId.get(item.individualId as string))
      .filter((id): id is string => !!id)
  )]

  if (tenantIds.length === 0) {
    return NextResponse.json({ error: 'Could not match any entries to tenants' }, { status: 400 })
  }

  const { data: tenantRows } = await supabase
    .from('tenants')
    .select('id, email, first_name')
    .in('id', tenantIds)

  const tenantContactById = new Map<string, { email: string; firstName: string }>()
  for (const t of tenantRows ?? []) {
    if (t.email) tenantContactById.set(t.id, { email: t.email, firstName: t.first_name ?? '' })
  }

  // ── Compute dates ────────────────────────────────────────────────────────────
  const runDate = new Date(batch.run_date + 'T12:00:00')
  const effectiveDate = nextBusinessDay(runDate)

  const [ry, rm, rd] = batch.run_date.split('-')
  const runDateFormatted = `${rm}-${rd}-${ry}`

  const effStr = effectiveDate.toISOString().slice(0, 10)
  const [ey, em, ed] = effStr.split('-')
  const effectiveFormatted = `${em}-${ed}-${ey}`

  // ── Load logo ────────────────────────────────────────────────────────────────
  let logoBase64 = ''
  try {
    logoBase64 = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png')).toString('base64')
  } catch { /* logo missing — email sends without it */ }

  const logoAttachment = logoBase64 ? [{
    name:          'logo.png',
    contentType:   'image/png',
    contentBase64: logoBase64,
    isInline:      true,
    contentId:     'logo@spearhead',
  }] : []

  // ── Send emails ──────────────────────────────────────────────────────────────
  let sent    = 0
  let skipped = 0

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const tenantId = tenantByIndividualId.get(item.individualId as string)
      if (!tenantId) { skipped++; return }

      const contact = tenantContactById.get(tenantId)
      if (!contact) { skipped++; return }

      const amountDollars = typeof item.amount === 'number' ? item.amount : 0
      const dollars = amountDollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      const name    = contact.firstName || String(item.individualName ?? 'Tenant')

      await sendEmail({
        to:          contact.email,
        fromName:    'Spearhead Properties',
        subject:     'Spearhead Rent Collection Submitted',
        attachments: logoAttachment,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#2d2d2d;padding:20px;text-align:center">
              ${logoBase64
                ? `<img src="cid:logo@spearhead" alt="Spearhead Properties" style="height:50px" />`
                : `<span style="color:#fff;font-size:20px;font-weight:bold">Spearhead Properties</span>`
              }
            </div>
            <div style="padding:32px">
              <h2 style="color:#2d2d2d;margin-top:0">Rent Collection on ${runDateFormatted} for ${name}</h2>
              <p style="color:#444">Electronic payment request was submitted.</p>
              <table style="border-collapse:collapse;font-size:14px;margin-top:16px">
                <tr>
                  <td style="padding:4px 24px 4px 0;color:#666">Amount</td>
                  <td><strong>${dollars}</strong></td>
                </tr>
                <tr>
                  <td style="padding:4px 24px 4px 0;color:#666">Effective date</td>
                  <td><strong>${effectiveFormatted}</strong></td>
                </tr>
              </table>
              <p style="color:#888;font-size:12px;margin-top:32px">
                If you have any questions, please <a href="mailto:info@spearheadproperties.com" style="color:#b22625">email us</a> for help.
              </p>
            </div>
          </div>
        `,
      })
      sent++
    })
  )

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason?.message ?? 'Unknown error')

  // ── Append to email_log ──────────────────────────────────────────────────────
  const { data: current } = await supabase
    .from('ach_batches')
    .select('email_log')
    .eq('id', batchId)
    .single()

  const existingLog = (current?.email_log ?? []) as Array<Record<string, unknown>>
  await supabase
    .from('ach_batches')
    .update({ email_log: [...existingLog, { sent_at: new Date().toISOString(), count: sent, type: 'resend' }] })
    .eq('id', batchId)

  return NextResponse.json({ ok: true, sent, skipped, errors })
}
