/**
 * GET /api/ach-preview
 *
 * Returns a preview of the NACHA file the cron would generate on the next run.
 * Uses the same logic as /api/ach-cron but does NOT send email or save a batch.
 * Applies the same 2pm CST cutoff rule.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'
import { generateNachaFile, type AchEntry, type NachaConfig } from '@/lib/nacha'
import { getPaymentDaysToProcess, nextBusinessDay } from '@/lib/business-days'

function getServiceSupabase() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('Supabase service role not configured')
  return createClient(url, secret, { auth: { persistSession: false } })
}

export async function GET(req: NextRequest) {
  // Auth check — must be logged-in admin
  const authClient = await createSupabaseServer()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nowUtc = new Date()
  const CST_OFFSET_MS = 6 * 60 * 60 * 1000
  const todayCst = new Date(nowUtc.getTime() - CST_OFFSET_MS)
  todayCst.setUTCHours(0, 0, 0, 0)

  const cutoffCst = new Date(todayCst.getTime() + 14 * 60 * 60 * 1000)
  const cutoffUtc = new Date(cutoffCst.getTime() + CST_OFFSET_MS)

  const paymentDays = getPaymentDaysToProcess(todayCst)
  const todayStr    = todayCst.toISOString().slice(0, 10)

  const supabase = getServiceSupabase()

  // Load bank records
  const { data: bankRecords, error: bankErr } = await supabase
    .from('tenant_bank_info')
    .select(`
      id, tenant_id, routing_number, account_number, account_type,
      account_holder_name, payment_day, ach_authorized_at, updated_at
    `)
    .eq('status', 'active')
    .in('payment_day', paymentDays.length > 0 ? paymentDays : [0])
    .not('ach_authorized_at', 'is', null)

  if (bankErr) return NextResponse.json({ error: bankErr.message }, { status: 500 })

  // Load rent amounts
  const tenantIds = (bankRecords ?? []).map(r => r.tenant_id)
  const { data: rentRows } = tenantIds.length > 0
    ? await supabase.from('rent_roll').select('tenant_id, monthly_rent, tenant_name').in('tenant_id', tenantIds)
    : { data: [] }

  const rentByTenant = new Map<string, { rent: number; name: string }>()
  for (const row of rentRows ?? []) {
    if (row.monthly_rent && row.monthly_rent > 0) {
      rentByTenant.set(row.tenant_id, {
        rent: Math.round(row.monthly_rent * 100),
        name: row.tenant_name ?? 'TENANT',
      })
    }
  }

  const entries: AchEntry[] = []
  const skipped: string[] = []
  const deferred: string[] = []

  for (const bank of bankRecords ?? []) {
    const lastChanged = bank.updated_at ?? bank.ach_authorized_at
    if (lastChanged && new Date(lastChanged) >= cutoffUtc) {
      deferred.push(bank.tenant_id)
      continue
    }
    const rentInfo = rentByTenant.get(bank.tenant_id)
    if (!rentInfo) { skipped.push(`${bank.tenant_id}: no rent amount`); continue }
    if (!/^\d{9}$/.test(bank.routing_number ?? '')) { skipped.push(`${bank.tenant_id}: invalid routing`); continue }

    entries.push({
      rdfiRoutingNumber: bank.routing_number,
      rdfiAccountNumber: bank.account_number,
      transactionCode:   bank.account_type === 'savings' ? '37' : '27',
      amountCents:       rentInfo.rent,
      individualId:      bank.tenant_id.slice(0, 15),
      individualName:    (bank.account_holder_name ?? rentInfo.name).slice(0, 22),
    })
  }

  const odfiBankRoutingNumber = process.env.ACH_ODFI_ROUTING
  const odfiBankName          = process.env.ACH_ODFI_BANK_NAME  ?? 'YOUR BANK'
  const companyName           = process.env.ACH_COMPANY_NAME    ?? 'SPEARHEAD PROP'
  const companyId             = process.env.ACH_COMPANY_ID      ?? '0000000000'

  if (!odfiBankRoutingNumber) {
    return NextResponse.json({ error: 'ACH_ODFI_ROUTING env var not set' }, { status: 500 })
  }

  const effectiveDate = nextBusinessDay(todayCst)
  const fileName = `rent_${todayStr.replace(/-/g, '')}.ach`

  if (entries.length === 0) {
    return NextResponse.json({
      ok: true,
      message: paymentDays.length === 0 ? 'No payments due today' : 'No valid entries',
      date: todayStr,
      effectiveDate: effectiveDate.toISOString().slice(0, 10),
      paymentDays,
      entries: [],
      skipped,
      deferred,
      fileContent: null,
      fileName,
    })
  }

  const config: NachaConfig = {
    odfiBankRoutingNumber,
    odfiBankName,
    companyName,
    companyId,
    entryDescription: 'RENT',
    effectiveDate,
  }

  const nacha = generateNachaFile(config, entries)

  return NextResponse.json({
    ok: true,
    date: todayStr,
    effectiveDate: effectiveDate.toISOString().slice(0, 10),
    paymentDays,
    entryCount: nacha.entryCount,
    totalCents: nacha.totalDebitCents,
    fileName,
    fileContent: nacha.content,
    entries: entries.map(e => ({
      name: e.individualName,
      amount: (e.amountCents / 100).toFixed(2),
      routing: e.rdfiRoutingNumber,
      account: '****' + e.rdfiAccountNumber.slice(-4),
      type: e.transactionCode === '37' ? 'savings' : 'checking',
    })),
    skipped,
    deferred,
  })
}
