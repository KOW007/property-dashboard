import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BankInfoForm from '@/components/BankInfoForm'

export const dynamic = 'force-dynamic'

export default async function PortalPaymentsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal-login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, unit_id')
    .eq('email', user.email)
    .single()

  // Get full receivables history
  const { data: history } = await supabase
    .from('receivables')
    .select('date, description, amount, type, reference')
    .eq('unit_id', tenant?.unit_id)
    .order('date', { ascending: false })
    .limit(50)

  // Get existing bank info
  const { data: bankInfo } = tenant ? await supabase
    .from('tenant_bank_info')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .single() : { data: null }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Payment History</h2>
          {history && history.length > 0 ? (
            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase pb-2">
                <span>Date</span>
                <span>Description</span>
                <span className="text-right">Amount</span>
              </div>
              {history.map((item, i) => (
                <div key={i} className="grid grid-cols-3 py-3 text-sm">
                  <span className="text-gray-500">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-gray-700">{item.description}</span>
                  <span className={`text-right font-semibold ${item.type === 'receipt' ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.type === 'receipt' ? '-' : ''}${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No payment history available.</p>
          )}
        </div>

        {/* Bank Info / ACH Setup */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">ACH / Auto-Pay Setup</h2>
          <p className="text-sm text-gray-500 mb-6">
            Provide your bank details below to set up automatic monthly payments. We will generate an ACH debit on your chosen payment day each month.
          </p>
          {tenant && (
            <BankInfoForm tenantId={tenant.id} existing={bankInfo} />
          )}
        </div>
      </div>
    </div>
  )
}
