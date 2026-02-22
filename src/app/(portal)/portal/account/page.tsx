import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountProfileForm from '@/components/AccountProfileForm'
import PortalAccountContent from '@/components/portal/PortalAccountContent'

export const dynamic = 'force-dynamic'

export default async function PortalAccountPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('email', user.email)
    .single()

  return (
    <PortalAccountContent
      tenant={tenant}
      userEmail={user.email ?? ''}
      formSlot={tenant ? <AccountProfileForm tenant={tenant} /> : null}
    />
  )
}
