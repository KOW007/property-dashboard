/**
 * POST /api/ach-export
 *
 * Generates a NACHA ACH file from the provided entries.
 * Requires a valid Azure AD Bearer token in the Authorization header.
 *
 * Body:
 *   { config: NachaConfig, entries: AchEntry[] }
 *
 * Returns:
 *   Content-Type: application/octet-stream
 *   Content-Disposition: attachment; filename="ach-YYYYMMDD.ach"
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAzureToken, extractBearerToken } from '@/lib/azure-auth'
import { generateNachaFile, NachaConfig, AchEntry } from '@/lib/nacha'
import { createSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // ── 1. Verify Supabase session (admin must be logged in) ──────────────────
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 })
  }

  // ── 2. Verify Azure AD token ──────────────────────────────────────────────
  const azureToken = extractBearerToken(req.headers.get('x-azure-token'))
  if (!azureToken) {
    return NextResponse.json(
      { error: 'Missing Azure AD token. Authenticate with Azure first.' },
      { status: 401 }
    )
  }

  try {
    await verifyAzureToken(azureToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token validation failed'
    return NextResponse.json({ error: `Azure token invalid: ${message}` }, { status: 403 })
  }

  // ── 3. Parse and validate request body ───────────────────────────────────
  let config: NachaConfig
  let entries: AchEntry[]

  try {
    const body = await req.json()
    config = body.config
    entries = body.entries

    if (!config || !entries?.length) {
      return NextResponse.json(
        { error: 'Body must contain config and at least one entry.' },
        { status: 400 }
      )
    }

    // Convert effectiveDate string → Date
    config.effectiveDate = new Date(config.effectiveDate)

    // Basic routing number validation
    for (const entry of entries) {
      const routing = entry.rdfiRoutingNumber.replace(/\D/g, '')
      if (routing.length !== 9) {
        return NextResponse.json(
          { error: `Invalid routing number for ${entry.individualName}: must be 9 digits.` },
          { status: 400 }
        )
      }
      if (!entry.rdfiAccountNumber?.trim()) {
        return NextResponse.json(
          { error: `Missing account number for ${entry.individualName}.` },
          { status: 400 }
        )
      }
      if (!Number.isInteger(entry.amountCents) || entry.amountCents <= 0) {
        return NextResponse.json(
          { error: `Amount must be a positive integer (cents) for ${entry.individualName}.` },
          { status: 400 }
        )
      }
      // Cap at $99,999.99 — reasonable max for a single rent ACH entry
      if (entry.amountCents > 9_999_999) {
        return NextResponse.json(
          { error: `Amount exceeds maximum allowed for ${entry.individualName}.` },
          { status: 400 }
        )
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bad request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // ── 4. Generate NACHA file ────────────────────────────────────────────────
  try {
    const result = generateNachaFile(config, entries)

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `ach-${today}.ach`

    return new NextResponse(result.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-ACH-Entry-Count': String(result.entryCount),
        'X-ACH-Total-Debit': String(result.totalDebitCents),
        'X-ACH-Total-Credit': String(result.totalCreditCents),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
