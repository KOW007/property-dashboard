import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getPortalTenant } from '@/lib/portal-auth'
import BankInfoForm from '@/components/BankInfoForm'
import PortalPaymentsContent from '@/components/portal/PortalPaymentsContent'

export const dynamic = 'force-dynamic'

export default async function PortalPaymentsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const tenant = await getPortalTenant(supabase, user, 'id')

  const { data: recentLease } = tenant ? await supabase
    .from('leases')
    .select('unit_id')
    .eq('tenant_id', tenant.id)
    .order('end_date', { ascending: false })
    .limit(1)
    .single() : { data: null }

  const unitId = recentLease?.unit_id

  const { data: history } = await supabase
    .from('receivables')
    .select('date, description, amount, type, reference')
    .eq('unit_id', unitId)
    .order('date', { ascending: false })
    .limit(50)

  const { data: bankInfo } = tenant ? await supabase
    .from('tenant_bank_info')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single() : { data: null }

  return (
    <div>
      <PortalPaymentsContent history={history} />

      {/* ACH Setup — rendered separately so BankInfoForm stays a client component */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">ACH / Auto-Pay Setup</h2>
        <p className="text-sm text-gray-500 mb-6">
          Provide your bank details below to set up automatic monthly payments. We will generate an ACH debit on your chosen payment day each month.
        </p>
        {tenant && (
          <BankInfoForm tenantId={tenant.id} existing={bankInfo} />
        )}
      </div>
    </div>
  )
}
