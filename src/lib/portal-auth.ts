/**
 * Secure portal tenant lookup.
 *
 * Looks up the tenant for the logged-in portal user.
 * - Prefers auth_user_id (Supabase UID) — immune to email reassignment.
 * - Falls back to email for tenants who haven't logged in since migration.
 * - Auto-populates auth_user_id on first login so next visit uses the secure path.
 *
 * As tenants log in, auth_user_id fills in automatically. No manual migration needed.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function getPortalTenant(
  supabase: SupabaseClient,
  user: User,
  select = 'id'
): Promise<Record<string, any> | null> {
  // ── Preferred: look up by Supabase UID ────────────────────────────────
  const { data: byUid } = await supabase
    .from('tenants')
    .select(select)
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (byUid) return byUid

  // ── Fallback: look up by email (pre-migration tenants) ────────────────
  // Always fetch id + auth_user_id so we can auto-populate below
  const fullSelect = select === '*'
    ? '*'
    : [...new Set(['id', 'auth_user_id', ...select.split(',').map(s => s.trim())])].join(', ')

  const { data: byEmail } = await supabase
    .from('tenants')
    .select(fullSelect)
    .eq('email', user.email)
    .maybeSingle()

  if (!byEmail) return null

  const tenant = byEmail as Record<string, any>

  // Auto-populate auth_user_id so next login uses the secure UID path.
  // Fire-and-forget — don't block the page on this update.
  if (!tenant.auth_user_id) {
    supabase
      .from('tenants')
      .update({ auth_user_id: user.id })
      .eq('id', tenant.id)
      .then()
  }

  return tenant
}
