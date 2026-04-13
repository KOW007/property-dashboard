/**
 * POST /api/portal-bank-info
 *
 * Tenant-facing API route for saving ACH bank info.
 * Captures authorization timestamp and IP for NACHA compliance.
 * Only the authenticated tenant can save their own bank info.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getPortalTenant } from '@/lib/portal-auth'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function validateRouting(r: string): boolean {
  if (!/^\d{9}$/.test(r)) return false
  // ABA checksum
  const d = r.split('').map(Number)
  const sum = 3*(d[0]+d[3]+d[6]) + 7*(d[1]+d[4]+d[7]) + (d[2]+d[5]+d[8])
  return sum % 10 === 0
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenant = await getPortalTenant(supabase, user, 'id')
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    bank_name,
    account_holder_name,
    routing_number,
    account_number,
    account_type,
    payment_day,
    authorized,
    authorization_text,
  } = body

  // Validate required fields
  if (!bank_name || !account_holder_name || !routing_number || !account_number || !account_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!validateRouting(routing_number)) {
    return NextResponse.json({ error: 'Invalid routing number' }, { status: 400 })
  }

  if (!/^\d{3,17}$/.test(account_number.replace(/\s/g, ''))) {
    return NextResponse.json({ error: 'Invalid account number' }, { status: 400 })
  }

  const pd = parseInt(payment_day)
  if (isNaN(pd) || pd < 1 || pd > 28) {
    return NextResponse.json({ error: 'Payment day must be between 1 and 28' }, { status: 400 })
  }

  if (!authorized || !authorization_text) {
    return NextResponse.json({ error: 'ACH authorization is required' }, { status: 400 })
  }

  const ip = getClientIp(req)
  const now = new Date().toISOString()

  // Check for existing bank info record
  const { data: existing } = await supabase
    .from('tenant_bank_info')
    .select('id')
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  const payload = {
    tenant_id:              tenant.id,
    bank_name:              bank_name.trim(),
    account_holder_name:    account_holder_name.trim(),
    routing_number:         routing_number.trim(),
    account_number:         account_number.trim(),
    account_type,
    payment_day:            pd,
    status:                 'active',
    updated_at:             now,
    ach_authorized_at:      now,
    ach_authorization_ip:   ip,
    ach_authorization_text: authorization_text,
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('tenant_bank_info')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('tenant_bank_info')
      .insert([payload])
    if (error) throw error
  }

  return NextResponse.json({ ok: true })
}
