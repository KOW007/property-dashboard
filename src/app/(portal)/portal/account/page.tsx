import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getPortalTenant } from '@/lib/portal-auth'
import AccountProfileForm from '@/components/AccountProfileForm'
import PortalAccountContent from '@/components/portal/PortalAccountContent'

export const dynamic = 'force-dynamic'

export default async function PortalAccountPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const tenant = await getPortalTenant(supabase, user, '*') as any

  return (
    <PortalAccountContent
      tenant={tenant}
      userEmail={user.email ?? ''}
      formSlot={tenant ? <AccountProfileForm tenant={tenant} /> : null}
    />
  )
}
