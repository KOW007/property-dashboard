import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AccountProfileForm from '@/components/AccountProfileForm'

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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Security Settings</h2>
          <p className="text-sm text-gray-500 mb-4">
            To change your login email or password, please contact your property manager.
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Email address</span>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Preferences</h2>
          <p className="text-sm text-gray-500">
            Contact your property manager at{' '}
            <a href="tel:5122361512" className="text-[#b22625] hover:underline">(512) 236-1512</a>{' '}
            to update your contact preferences.
          </p>
        </div>

        {/* Contact Information */}
        {tenant && (
          <div className="lg:col-span-2">
            <AccountProfileForm tenant={tenant} />
          </div>
        )}
      </div>
    </div>
  )
}
