interface Tenant {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  [key: string]: any
}

interface Props {
  tenant: Tenant | null
  userEmail: string
  isPreview?: boolean
  // For real portal — slot in the editable form
  formSlot?: React.ReactNode
}

export default function PortalAccountContent({ tenant, userEmail, isPreview, formSlot }: Props) {
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
              <p className="text-gray-500">{userEmail}</p>
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
            {isPreview ? (
              // Read-only view for admin preview
              <div className="bg-white rounded-xl shadow-sm border-t-4 border-[#b22625] p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">First Name</p>
                    <p className="text-gray-800">{tenant.first_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Last Name</p>
                    <p className="text-gray-800">{tenant.last_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Email</p>
                    <p className="text-gray-800">{tenant.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Phone</p>
                    <p className="text-gray-800">{tenant.phone || '—'}</p>
                  </div>
                  {tenant.vehicle_1_make && (
                    <div>
                      <p className="text-gray-500 font-medium">Vehicle</p>
                      <p className="text-gray-800">
                        {[tenant.vehicle_1_year, tenant.vehicle_1_make, tenant.vehicle_1_model].filter(Boolean).join(' ')}
                        {tenant.vehicle_1_license_plate && ` · ${tenant.vehicle_1_license_plate}`}
                        {tenant.vehicle_1_state && ` (${tenant.vehicle_1_state})`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              formSlot
            )}
          </div>
        )}
      </div>
    </div>
  )
}
