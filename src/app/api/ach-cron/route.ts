/**
 * POST /api/ach-cron
 *
 * Daily ACH rent collection cron — called by Vercel Cron (see vercel.json).
 * Runs Mon–Fri at 2:30 PM CDT (19:30 UTC daylight / 20:30 UTC standard).
 *
 * Cutoff rule: any tenant_bank_info record with updated_at >= 2:30 PM CST today
 * is skipped and will be picked up by tomorrow's run (next business day).
 *
 * What it does:
 *  1. Determine which payment_day values are due today (business day logic).
 *  2. Load all active tenant bank info records for those payment days.
 *  3. Skip records changed at or after the 2:30pm CST cutoff (deferred to tomorrow).
 *  4. Load each tenant's current monthly rent from rent_roll.
 *  5. Generate a NACHA PPD debit file.
 *  6. Email the file as an attachment to the admin.
 *  7. Log the batch in ach_batches for audit.
 *
 * Security: requires Authorization: Bearer <CRON_SECRET> header.
 * Vercel automatically sends this header when CRON_SECRET env var is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateNachaFile, type AchEntry, type NachaConfig } from '@/lib/nacha'
import { uploadAchFile } from '@/lib/boc-bank'
import { sendEmail } from '@/lib/email'
import { getPaymentDaysToProcess, nextBusinessDay } from '@/lib/business-days'

// Use service role — bypasses RLS for server-side batch processing
function getServiceSupabase() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('Supabase service role not configured')
  return createClient(url, secret, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  // ── 1. Auth check ───────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Determine today's payment days ───────────────────────────────────────
  // Treat "today" as CST (UTC-6 standard, UTC-5 daylight).
  // Vercel runs in UTC; cron fires at 20:30 UTC = 14:30 CST / 15:30 CDT.
  // We use CST (UTC-6) as the fixed offset — Austin, TX standard time.
  const nowUtc = new Date()
  const CST_OFFSET_MS = 6 * 60 * 60 * 1000
  const todayCst = new Date(nowUtc.getTime() - CST_OFFSET_MS)
  todayCst.setUTCHours(0, 0, 0, 0)

  // 2:30pm CST cutoff: bank info records updated on or after this timestamp
  // are deferred to the next business day's run.
  const cutoffCst = new Date(todayCst.getTime() + (14 * 60 + 30) * 60 * 1000) // today 14:30 CST
  const cutoffUtc = new Date(cutoffCst.getTime() + CST_OFFSET_MS)       // convert back to UTC for DB comparison

  const paymentDays = getPaymentDaysToProcess(todayCst)
  const todayStr    = todayCst.toISOString().slice(0, 10)

  if (paymentDays.length === 0) {
    return NextResponse.json({ ok: true, message: 'No payments due today', date: todayStr })
  }

  const supabase = getServiceSupabase()

  // ── 3. Check for duplicate run ──────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('ach_batches')
    .select('id, status')
    .eq('run_date', todayStr)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      ok: false,
      message: `Batch for ${todayStr} already exists (status: ${existing.status})`,
      batchId: existing.id,
    })
  }

  // ── 4. Load tenant bank info for due payment days ───────────────────────────
  const { data: bankRecords, error: bankErr } = await supabase
    .from('tenant_bank_info')
    .select(`
      id,
      tenant_id,
      routing_number,
      account_number,
      account_type,
      account_holder_name,
      payment_day,
      ach_authorized_at,
      updated_at
    `)
    .eq('status', 'active')
    .in('payment_day', paymentDays)
    .not('ach_authorized_at', 'is', null)

  if (bankErr) throw bankErr

  if (!bankRecords || bankRecords.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'No authorized bank records for today\'s payment days',
      paymentDays,
      date: todayStr,
    })
  }

  // ── 5. Load rent amounts from rent_roll ─────────────────────────────────────
  const tenantIds = bankRecords.map(r => r.tenant_id)

  const { data: rentRows, error: rentErr } = await supabase
    .from('rent_roll')
    .select('tenant_id, monthly_rent, tenant_name')
    .in('tenant_id', tenantIds)

  if (rentErr) throw rentErr

  const rentByTenant = new Map<string, { rent: number; name: string }>()
  for (const row of rentRows ?? []) {
    if (row.monthly_rent && row.monthly_rent > 0) {
      rentByTenant.set(row.tenant_id, {
        rent: Math.round(row.monthly_rent * 100), // dollars → cents
        name: row.tenant_name ?? 'TENANT',
      })
    }
  }

  // ── 5b. Load tenant emails ──────────────────────────────────────────────────
  const { data: tenantEmailRows } = await supabase
    .from('tenants')
    .select('id, email, first_name')
    .in('id', tenantIds)

  const emailByTenant = new Map<string, { email: string; firstName: string }>()
  for (const row of tenantEmailRows ?? []) {
    if (row.email) emailByTenant.set(row.id, { email: row.email, firstName: row.first_name ?? '' })
  }

  // ── 6. Build ACH entries ────────────────────────────────────────────────────
  const entries: AchEntry[] = []
  const skipped: string[] = []
  const deferred: string[] = []
  const tenantPayments: Array<{ email: string; name: string; amountCents: number }> = []

  for (const bank of bankRecords) {
    // Skip records changed at or after the 2:30pm CST cutoff — defer to next business day
    const lastChanged = bank.updated_at ?? bank.ach_authorized_at
    if (lastChanged && new Date(lastChanged) >= cutoffUtc) {
      deferred.push(`${bank.tenant_id}: bank info changed after 2:30pm CST cutoff`)
      continue
    }

    const rentInfo = rentByTenant.get(bank.tenant_id)
    if (!rentInfo) {
      skipped.push(`${bank.tenant_id}: no rent amount`)
      continue
    }

    // Validate routing number format
    if (!/^\d{9}$/.test(bank.routing_number ?? '')) {
      skipped.push(`${bank.tenant_id}: invalid routing number`)
      continue
    }

    entries.push({
      rdfiRoutingNumber: bank.routing_number,
      rdfiAccountNumber: bank.account_number,
      transactionCode:   bank.account_type === 'savings' ? '37' : '27',
      amountCents:       rentInfo.rent,
      individualId:      bank.tenant_id.slice(0, 15),
      individualName:    (bank.account_holder_name ?? rentInfo.name).slice(0, 22),
    })

    const contact = emailByTenant.get(bank.tenant_id)
    if (contact) {
      tenantPayments.push({
        email:       contact.email,
        name:        contact.firstName || rentInfo.name,
        amountCents: rentInfo.rent,
      })
    }
  }

  if (entries.length === 0) {
    return NextResponse.json({
      ok: false,
      message: 'No valid entries to include',
      skipped,
      deferred,
      paymentDays,
      date: todayStr,
    })
  }

  // ── 7. Generate NACHA file ──────────────────────────────────────────────────
  const odfiBankRoutingNumber = process.env.ACH_ODFI_ROUTING
  const odfiBankName          = process.env.ACH_ODFI_BANK_NAME   ?? 'YOUR BANK'
  const companyName           = process.env.ACH_COMPANY_NAME     ?? 'SPEARHEAD PROP'
  const companyId             = process.env.ACH_COMPANY_ID       ?? '0000000000'

  if (!odfiBankRoutingNumber) {
    throw new Error('ACH_ODFI_ROUTING env var not set')
  }

  // Effective date = next business day from today
  const effectiveDate = nextBusinessDay(todayCst)

  const config: NachaConfig = {
    odfiBankRoutingNumber,
    odfiBankName,
    companyName,
    companyId,
    entryDescription: 'RENT',
    effectiveDate,
  }

  const nacha = generateNachaFile(config, entries)

  // ── 8. Save batch record (status: generated) ────────────────────────────────
  const fileName = `rent_${todayStr.replace(/-/g, '')}.ach`

  const { data: batch, error: batchErr } = await supabase
    .from('ach_batches')
    .insert([{
      run_date:     todayStr,
      payment_days: paymentDays,
      entry_count:  nacha.entryCount,
      total_cents:  nacha.totalDebitCents,
      file_name:    fileName,
      status:       'generated',
    }])
    .select('id')
    .single()

  if (batchErr) throw batchErr

  // ── 9. Upload ACH file to BOC Bank ─────────────────────────────────────────
  let bocFileId: string | null = null
  let bocReferences: unknown[] = []

  try {
    const bocResponse = await uploadAchFile(nacha.content, fileName)
    bocFileId = bocResponse.fileId
    bocReferences = bocResponse.items.map(item => ({
      bankReference: item.bankReference,
      traceNumber:   item.traceNumber,
      individualId:  item.individualId,
      amount:        item.amount,
      status:        item.status,
    }))

    await supabase
      .from('ach_batches')
      .update({
        status:           'uploaded',
        boc_file_id:      bocFileId,
        boc_upload_status: bocResponse.status,
        boc_uploaded_at:  bocResponse.receivedDate,
        boc_references:   bocReferences,
      })
      .eq('id', batch.id)

    // ── 9b. Email tenants — fire-and-forget, don't block on failures ───────
    if (tenantPayments.length > 0) {
      const effectiveDateStr = effectiveDate.toISOString().slice(0, 10)
      await Promise.allSettled(
        tenantPayments.map(({ email, name, amountCents }) => {
          const dollars = (amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          return sendEmail({
            to:      email,
            subject: `Rent Payment Submitted — ${dollars}`,
            html: `
              <p>Hi ${name},</p>
              <p>Your rent payment of <strong>${dollars}</strong> has been submitted for processing and will be debited from your account on <strong>${effectiveDateStr}</strong>.</p>
              <p>If you have any questions, please don't hesitate to reach out.</p>
              <p style="color:#666;font-size:12px">— Spearhead Properties</p>
            `,
          })
        })
      )
    }

  } catch (uploadErr: any) {
    const errMsg = String(uploadErr.message ?? uploadErr)
    await supabase
      .from('ach_batches')
      .update({ status: 'failed', error_message: errMsg })
      .eq('id', batch.id)

    return NextResponse.json({
      ok:      false,
      message: 'ACH file generated but BOC Bank upload failed',
      error:   errMsg,
      batchId: batch.id,
    }, { status: 500 })
  }

  // ── 10. Email confirmation to admin ─────────────────────────────────────────
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) throw new Error('ADMIN_ALERT_EMAIL not configured')

  const totalDollars = (nacha.totalDebitCents / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
  })

  const contentBase64 = Buffer.from(nacha.content, 'utf-8').toString('base64')

  const html = `
    <h2 style="color:#2d2d2d">Daily ACH Rent Collection — ${todayStr}</h2>
    <p>The ACH file has been generated and successfully uploaded to BOC Bank.</p>
    <table style="border-collapse:collapse;font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#666">Run date</td><td><strong>${todayStr}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Entries</td><td><strong>${nacha.entryCount}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Total</td><td><strong>${totalDollars}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Effective date</td><td><strong>${effectiveDate.toISOString().slice(0, 10)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">File</td><td><strong>${fileName}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">BOC File ID</td><td><strong>${bocFileId}</strong></td></tr>
      ${skipped.length > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Skipped</td><td>${skipped.length} tenant(s)</td></tr>` : ''}
      ${deferred.length > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Deferred (after 2:30pm)</td><td>${deferred.length} tenant(s) — will run tomorrow</td></tr>` : ''}
    </table>
    <p style="margin-top:16px;color:#666;font-size:12px">
      The file has been submitted to BOC Bank and is queued for processing. No manual upload needed.<br>
      Batch ID: ${batch.id}
    </p>
    ${skipped.length > 0 ? `<p style="color:#b22625;font-size:12px"><strong>Skipped tenants:</strong><br>${skipped.join('<br>')}</p>` : ''}
    ${deferred.length > 0 ? `<p style="color:#b45309;font-size:12px"><strong>Deferred to next business day (changed after 2:30pm CST):</strong><br>${deferred.join('<br>')}</p>` : ''}
  `

  try {
    await sendEmail({
      to:      adminEmail,
      subject: `ACH Rent File Uploaded — ${todayStr} — ${nacha.entryCount} entries — ${totalDollars}`,
      html,
      attachments: [{
        name:          fileName,
        contentType:   'application/octet-stream',
        contentBase64,
      }],
    })

    await supabase
      .from('ach_batches')
      .update({ status: 'sent' })
      .eq('id', batch.id)

  } catch (emailErr: any) {
    // File was uploaded to BOC Bank — log email failure but don't crash
    await supabase
      .from('ach_batches')
      .update({ error_message: String(emailErr.message ?? emailErr) })
      .eq('id', batch.id)

    return NextResponse.json({
      ok:        false,
      message:   'ACH file uploaded to BOC Bank but confirmation email failed',
      error:     String(emailErr.message ?? emailErr),
      batchId:   batch.id,
      bocFileId,
    }, { status: 500 })
  }

  return NextResponse.json({
    ok:          true,
    date:        todayStr,
    paymentDays,
    entryCount:  nacha.entryCount,
    totalCents:  nacha.totalDebitCents,
    fileName,
    batchId:     batch.id,
    bocFileId,
    skipped,
    deferred,
  })
}

// Vercel Cron sends GET requests — re-export POST handler
export const GET = POST
